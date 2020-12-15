//
//  File.swift
//  
//
//  Created by Ritesh Pakala on 12/12/20.
//

import Foundation
import Fluent
import Vapor
import Core
import Storage
import Datastore
import CoreML


var service = BackendService()

struct PredictController: RouteCollection {
    let loopGroup: EventLoopGroup
    
    let stoicSentiment: VaderSentiment = .init()
    
    init(loopGroup: EventLoopGroup, backend: GoogleCloudStorageClient?) {
        self.loopGroup = loopGroup
        service.gcs = backend
    }
    
    func boot(routes: RoutesBuilder) throws {
        let todos = routes.grouped("predict")
        todos.get(use: index)
        todos.group(":predictSymbol") { todo in
            todo.get(use: predict)
        }
        todos.group("update") { todo in
            todo.get(use: index)
        }
        todos.group("think") { todo in
            todo.on(.GET, body: .collect(maxSize: 500000), use: think)
        }
    }
    
    func think(req: Request) throws -> EventLoopFuture<Sentiment> {
        let promise = loopGroup.next().makePromise(of: Sentiment.self)
        let contentType = req.headers["Content-Type"]
        if let data = req.body.string {
            
            let data2 = data.data(using: .utf8)!
            if let object = try? JSON.init(data: data2) {
                if let itemArray = object.dictionary?["tweet_data"]?.dictionary?["statuses"]?.array {
                    var results: [(Tweet, VaderSentimentOutput)] = []
                    for item in itemArray {
                        let object =  item.dictionary

                        let user = object?["user"]
                        let name = object?["screen_name"]?.string ?? ""
                        let followers = object?["followers_count"]?.double ?? 0.0

                        let retweets = object?["retweet_count"]?.double ?? 0.0
                        let favorites = object?["favorite_count"]?.double ?? 0.0

                        let entities = object?["entities"]?.dictionary
                        let urls: [String] = (entities?["urls"]?.array?.map({ $0.dictionary?["expanded_url"]?.string ?? "" })) ?? []
                        let symbols: [String] = (entities?["symbols"]?.array?.map({ $0.dictionary?["text"]?.string ?? "" })) ?? []
                        let text: String = object?["text"]?.string ?? ""
                        let createdAt = object?["created_at"]?.string ?? ""

                        let metadata: TweetMetadata = .init(
                            name: name,
                            followersCount: Int(followers),
                            retweetCount: Int(retweets),
                            favouritesCount: Int(favorites),
                            urls: urls,
                            symbols: symbols,
                            text: text,
                            createdAt: createdAt)
                        
                        //
//                            let theDate: Bool
//                            let targetDate = (oracle.fromDate.asDate() ?? Date()).dateComponents()
//                            let tweetDate = metadata.asDate.dateComponents()
//                            if tweetDate.day <= targetDate.day &&
//                                tweetDate.month <= targetDate.month &&
//                                tweetDate.year <= targetDate.year {
//                                theDate = true
//                            } else {
//                                theDate = false
//                            }
                        //

                        //TODO: Used to be no links, but we should scrape the link soon
                        // ...
                        //
                        let theURLs: Bool = metadata.urls.isEmpty || (text.count > 24)

                        let collected: [String] = results.map({ $0.0.text.lowercased() })
                        let theDupe: Bool = !collected.contains(text.lowercased())

                        if theURLs, theDupe {
                            let prediction = VaderSentiment.predict(metadata.text)
//                                let theSentiment: Bool = prediction.compound != 0
                            #if DEBUG
                            print("%%%%%%%%%\n Sentiment Candidate \n%%%%%%\n\n")
                            print(metadata.toString)
                            print(prediction.asString)
                            print("%%%%%%%%%\n \(prediction.asString) \n%%%%%%\n\n")
                            #endif
                            results.append((metadata.asTweet, prediction))
                            
                        } else {
                            print("{TEST-error} \(metadata.text)\(theURLs) \(theDupe)")
//                                print(metadata.toString)
//                                print("###########\n errror :: query: \(query) \n###########\n\n")
                        }
                    }
                    
                    let sentiments = results.map { $0.1 }
                    let sumsOfPositives = (sentiments.map { $0.pos }.reduce(0, +))/Double(sentiments.count)
                    let sumsOfNegatives = (sentiments.map { $0.neg }.reduce(0, +))/Double(sentiments.count)
                    let sumsOfNeutral = (sentiments.map { $0.neu }.reduce(0, +))/Double(sentiments.count)
                    
                    
                    promise.completeWith(.init(catching: {
                        Sentiment.init(posValue: "\(sumsOfPositives)", negValue: "\(sumsOfNegatives)", neuValue: "\(sumsOfNeutral)")
                    }))
                    print("prediction Average: \(sumsOfPositives) :: \(sumsOfNegatives) :: \(sumsOfNeutral)")
                }
            }
            
            
            
//            do {
//
//                if let jsonArray = try JSONSerialization.jsonObject(with: data2, options : .allowFragments) as? Dictionary<String,Any>
//                {
//                   print(jsonArray) // use the json here
//                } else {
//                    print("bad json")
//                }
//            } catch let error as NSError {
//                print(error)
//            }
        }
        
        return promise.futureResult
    }

    func predict(req: Request) throws -> EventLoopFuture<Prediction> {
        let promise = loopGroup.next().makePromise(of: Prediction.self)
        let symbol = req.parameters.get("predictSymbol")
        
        var pos: Double = 0.25
        var neg: Double = 0.25
        var neu: Double = 0.5
        var type: String = "close"
        if
            let neuQ = req.query[Double.self, at: "neu"],
            let negQ = req.query[Double.self, at: "neg"],
            let posQ = req.query[Double.self, at: "pos"],
            let typeQ = req.query[String.self, at: "type"] {
            
            pos = posQ
            neg = negQ
            neu = neuQ
            type = typeQ
        }
        
//        //http://localhost:8080/predict/$MSFT?neu=0.5&neg=0.25&pos=0.25
        
        //Get the highest trained model
        let targets = service.models.filter({ $0.symbol ==  symbol })
        //get the most trained model for now....
        let sorted = targets.sorted(by: { Int($0.metadata.metadata?["daysTrained"] ?? "0") ?? 0 > Int($1.metadata.metadata?["daysTrained"] ?? "0") ?? 0 })
        if let model = sorted.first {
            
            promise.completeWith(.init(catching: { () -> Prediction in
                let value = runModel(
                                model: model.model,
                                dataSet: model.dataSet,
                                pos: pos,
                                neg: neg,
                                neu: neu,
                                type: type)
                
                let posAsString = String(round(100*pos)/100)
                let negAsString = String(round(100*neg)/100)
                let neuAsString = String(round(100*neu)/100)
                return Prediction.init(prediction: value, metadata: model.metadata, type: type, posValue: posAsString, negValue: negAsString, neuValue: neuAsString)
            }))
        } else {
            print("fml \(symbol)")
            try index(req: req).whenComplete( { (response) in
                switch response {
                case .success(_):
                    do {
                        do {
                            promise.completeWith(try predict(req: req))
                        } catch let error {
                            print(error.localizedDescription)
                        }
                    }
                default:
                    promise.completeWith(.init(catching: {
                        return .init(prediction: "error", metadata: .init(), type: "none")
                    }))
                }
            })
            
        }
        
        return promise.futureResult
    }

//    func delete(req: Request) throws -> EventLoopFuture<HTTPStatus> {
//        return Todo.find(req.parameters.get("todoID"), on: req.db)
//            .unwrap(or: Abort(.notFound))
//            .flatMap { $0.delete(on: req.db) }
//            .transform(to: .ok)
//    }
    

    func index(req: Request) throws -> EventLoopFuture<String> {
        let promise = loopGroup.next().makePromise(of: String.self)
        
        if let models = service.gcs?.object.list(bucket: "stoic-45d04-models-us", queryParameters: nil) {
            
            _ = models.map { item in
                
                let names: [String] = (item.items?.compactMap { $0.name }) ?? []
                
                var idsToSymbol: [String: String] = [:]
                for name in names {
                    let parsed = name.components(separatedBy: "/")
                    idsToSymbol[parsed[1]] = parsed[0]
                }
                
                let ids = Array(idsToSymbol.keys) // Array(Set(names.compactMap { $0.components(separatedBy: "/")[1] }))
                
                var idsToModelData: [String: Data] = [:]
                var idsToDataSetData: [String: Data] = [:]
                var idsToMetaData: [String: Data] = [:]
                
                var loops: Int = 0
                for object in (item.items ?? []) {
                    let loop = service.gcs?.object.getMedia(
                        bucket: "stoic-45d04-models-us",
                        object: object.name?.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed) ?? "",
                        range: nil,
                        queryParameters: nil).map { $0.data }
                    
                    loop?.whenComplete({ data in
                        switch data {
                        case .success(let data):
                            let parsed = object.name?.components(separatedBy: "/")
                            let id: String = parsed?[1] ?? ""
                            
                            if object.name?.contains("metadata") == true {
                                idsToMetaData[id] = data ?? .init()
                            }else if object.name?.contains("dataSet") == true {
                                idsToDataSetData[id] = data ?? .init()
                            } else {
                                idsToModelData[id] = data ?? .init()
                            }
                        default:
                            break
                        }
                        
                        loops += 1
                        if loops >= (item.items?.count ?? 0) {
                            
                            service.models = generatePayload(ids: ids, idsToSymbol: idsToSymbol, idsToModel: idsToModelData, idsToData: idsToDataSetData, idsToMetaData: idsToMetaData)
                            
                            
                            promise.completeWith(.init(catching: {
                                return "loaded"
                            }))
                        }
                    })
                    
                    loop?.whenFailure { error in
                        print(error)
                        
                        loops += 1
                        
                        if loops >= (item.items?.count ?? 0) {
                           
                        }
                    }
                }
            }
        }
        
        return promise.futureResult
    }
    
    
    func generatePayload(ids: [String], idsToSymbol: [String:String], idsToModel: [String: Data], idsToData: [String: Data], idsToMetaData: [String: Data]) -> [ModelPayload] {
        var modelPayloads: [ModelPayload] = []
        for id in ids {
            let payload = ModelPayload(
                symbol: idsToSymbol[id] ?? "",
                id: id,
                model: idsToModel[id] ?? .init(),
                dataSet: idsToData[id] ?? .init(),
                metadata: idsToMetaData[id] ?? .init())
            
            modelPayloads.append(payload)
        }
        
        return modelPayloads
    }

    func runModel(model: Data, dataSet: Data, pos: Double, neg: Double, neu: Double, type: String) -> String {
        if let models = model.model, let data = dataSet.dataSet, data.keys.contains(type) {
//            print(data[type])
            var closeData: [Double] = data[type] ?? []
            let posIndex: Int = closeData.count - 3
            let negIndex: Int = closeData.count - 2
            let neuIndex: Int = closeData.count - 1
            
            let testData = DataSet(
                dataType: .Regression,
                inputDimension: closeData.count,
                outputDimension: 1)
            
            closeData[posIndex] = pos
            closeData[negIndex] = neg
            closeData[neuIndex] = neu
            
            try? testData.addTestDataPoint(input: closeData)
            
            
            models.model(forType: .forValue(type))?.predictValues(data: testData)
            
            guard let output = testData.singleOutput(index: 0) else {
                
                return "error"
            }
            
            print ("""
                input: \(closeData)
                prediction: \(output)
                """)
            return "\(output)"
        }
        
        return "error-2"
    }
}

struct TweetMetadata {
    let name: String
    let followersCount: Int
    let retweetCount: Int
    let favouritesCount: Int
    let urls: [String]
    let symbols: [String]
    let text: String
    let createdAt: String
    
    
    var asDate: Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE MMM dd HH:mm:ss Z yyyy"
        return formatter.date(from: createdAt) ?? Date()
    }
    
    var toString: String {
        """
        name: \(name)
        followers: \(followersCount)
        retweets: \(retweetCount)
        favourites: \(favouritesCount)
        urls: \(urls.count)
        symbols: \(symbols)
        text: \(text)
        createdAt: \(createdAt)
        """
    }
    
    var asTweet: Tweet {
        return .init(text: text, time: "\(Int(asDate.timeIntervalSince1970))", lang: "en")
    }
}

public class Tweet: NSObject, Codable, NSCoding, NSSecureCoding {
    public static var supportsSecureCoding: Bool = true
    
    let text: String
    let time: String
    let lang: String
    
    var date: String {
        if let timeInt = Int(time) {
            return Calendar.nyDateFormatter.string(
                from: Double(timeInt).date())
        } else {
            return ""
        }
    }
    
    public init(text: String, time: String, lang: String) {
        self.text = text
        self.time = time
        self.lang = lang
    }
    
    public required convenience init?(coder: NSCoder) {
        let text = (coder.decodeObject(forKey: "text") as? String) ?? ""
        let time = (coder.decodeObject(forKey: "time") as? String) ?? ""
        let lang = (coder.decodeObject(forKey: "lang") as? String) ?? ""

        self.init(
            text: text,
            time: time,
            lang: lang)
    }

    public func encode(with coder: NSCoder){
        coder.encode(text, forKey: "text")
        coder.encode(time, forKey: "time")
        coder.encode(lang, forKey: "lang")
    }
}




//import Foundation
//import CoreML
//
//class StoicSentimentModel {
//    lazy var model: StoicRNN_10? = {
//        try? StoicRNN_10.init(configuration: .init())
//    }()
//    let maxLength = 24
//    let vectorSize = 200
//    var lemmatizer = Lemmatizer()
//    var stopWords: [String] = ["no", "ve", "needn't", "some", "and", "y", "he", "those", "whom", "theirs", "nor", "my", "yourself", "mightn", "i", "does", "not", "too", "shan't", "did", "have", "until", "after", "yours", "the", "all", "wasn", "don", "hasn", "on", "in", "their", "when", "m", "himself", "won", "our", "which", "then", "be", "because", "hadn", "they", "were", "mustn't", "them", "so", "aren't", "hasn't", "with", "should've", "her", "its", "above", "we", "while", "won't", "wouldn't", "each", "him", "there", "just", "both", "ma", "are", "couldn", "up", "re", "is", "doesn", "you'd", "how", "doing", "themselves", "wouldn", "d", "it", "during", "couldn't", "you'll", "your", "wasn't", "why", "under", "doesn't", "these", "from", "about", "myself", "over", "same", "do", "again", "as", "should", "shan", "now", "was", "don't", "a", "this", "here", "t", "through", "that'll", "than", "s", "can", "ll", "haven", "against", "haven't", "or", "if", "only", "most", "out", "such", "between", "off", "you", "herself", "it's", "been", "ain", "his", "being", "shouldn", "having", "isn't", "mustn", "am", "ourselves", "of", "will", "but", "once", "to", "hadn't", "needn", "itself", "more", "very", "you've", "weren", "she", "own", "mightn't", "any", "for", "has", "who", "me", "an", "didn't", "below", "by", "you're", "further", "didn", "where", "ours", "into", "aren", "shouldn't", "down", "isn", "other", "yourselves", "had", "at", "hers", "before", "weren't", "what", "few", "that", "o", "she's"]
//    lazy var wordDictionary: [String: Int] = {
//        return try! JSONDecoder().decode(Dictionary<String, Int>.self, from: Data(contentsOf: Bundle.main.url(forResource:"Words", withExtension: "json")!))
//    }()
//
//    lazy var wordDictionaryKeys: [String] = {
//        Array(wordDictionary.keys)
//    }()
//
//    lazy var classes: [String] = {
//        return try! JSONDecoder().decode(Array<String>.self, from: Data(contentsOf: Bundle.main.url(forResource:"Classes", withExtension: "json")!))
//    }()
//
//    func predict(_ utterance: String) -> VaderSentimentOutput? {
//        guard let model = self.model else { return nil }
//
//        let cleaned = cleanTweet(utterance)
//        let words = lemmatizer.lemmatize(text: cleaned).compactMap { $0.0 } //$0.1 for lemma -- $0.0 Do not take lemma but original word !!!
//
//        guard words.count > 0 else { return nil }
//
//        var embedding = [Int]()
//        for word in words {
//            let potentialSub: String? = wordDictionaryKeys.first(where: { key in
//
//                //Twitter underscore
//                let split = word.components(separatedBy: "_")
//
//                return !split.filter { split_word in key == split_word }.isEmpty
//
//            })
//
//            var potentialWordValue: Int? = wordDictionary[word]
//
//            if let sub = potentialSub, potentialWordValue == nil {
//                potentialWordValue = wordDictionary[sub]
//            }
//
//            embedding.append(potentialWordValue ?? 0)
//        }
//
//        //
//
//        let maxLengthNumber = NSNumber(value: maxLength)
//
//        guard let input_data = try? MLMultiArray(shape:[maxLengthNumber,1,1], dataType:.float32) else {
//            fatalError("Unexpected runtime error: input_data")
//        }
//
//        var input_array: [[Float32]] = .init(repeating: .init(repeating: 0, count: maxLength), count: words.count)
//
//        for i in 0..<embedding.count {
//            input_array[i][0] = Float32(embedding[i])
//        }
//
//        guard let gru_data = try? MLMultiArray(shape:[maxLengthNumber], dataType:.float32) else {
//            fatalError("Unexpected runtime error: input_data")
//        }
//
//        for i in 0..<maxLength {
//            gru_data[i] = 0
//        }
//
//        //
//
//        var predictions: [[Float]] = []
//        for list in input_array {
//            for (i, item) in list.enumerated() {
//                input_data[i] = NSNumber.init(value: item)
//            }
//
//            let result = runInference(input_data: input_data, gru: gru_data, model: model)
//
//            if let b = try? UnsafeBufferPointer<Float>(result.prediction) {
//                let c = Array(b)
//                predictions.append(c)
//            }
//        }
//
//        //MODEL
//
//        let allValues: [Float] = predictions.flatMap { $0 }
//
//        let negatives: [Float] = allValues.enumerated().filter({ ($0.offset + 3) % 3 == 0 }).map { $0.element }
//        let neutrals: [Float] = allValues.enumerated().filter({ ($0.offset + 2) % 3 == 0 }).map { $0.element }
//        let positives: [Float] = allValues.enumerated().filter({ ($0.offset + 1) % 3 == 0 }).map { $0.element }
//
//        let averages: [Float] = [negatives.reduce(0, +)/Float(negatives.count), neutrals.reduce(0, +)/Float(neutrals.count), positives.reduce(0, +)/Float(positives.count)]
//
//
//        return VaderSentimentOutput.init(pos: Double(averages[2]), neg: Double(averages[0]), neu: Double(averages[1]), compound: 0.0)
//    }
//
//    func runInference(input_data: MLMultiArray, gru: MLMultiArray, model: StoicRNN_10) -> (prediction: MLMultiArray, gru: MLMultiArray) {
//
//        let input = StoicRNN_10Input(input1: input_data, gru_23_h_in: gru)
//
//        guard let prediction = try? model.prediction(input: input) else {
//            fatalError("Unexpected runtime error: prediction")
//        }
//
//        guard let gru_data = try? MLMultiArray(shape:gru.shape, dataType:.float32) else {
//            fatalError("Unexpected runtime error: input_data")
//        }
//
//        for i in 0..<gru_data.shape[0].intValue {
//            gru_data[i] = prediction.gru_23_h_out[i]
//        }
//
//        return (prediction.output1, gru_data)
//    }
//}
//
//
//
//public func cleanTweet(_ text: String) -> String {
//    let specialCharacters: [String:String] = [
//        "\\x89Û_":"",
//        "\\x89ÛÒ":"",
//        "\\x89ÛÓ":"",
//        "\\x89ÛÏWhen":"When",
//        "\\x89ÛÏ":"",
//        "China\\x89Ûªs":"China's",
//        "let\\x89Ûªs": "let's",
//        "\\x89Û÷": "",
//        "\\x89Ûª": "",
//        "\\x89Û\\x9d": "",
//        "å_": "",
//        "l\\x89Û¢": "",
//        "\\x89Û¢åÊ":"",
//        "fromåÊwounds":"from wounds",
//        "åÊ":"",
//        "åÈ":"",
//        "JapÌ_n":"Japan",
//        "Ì©":"e",
//        "å¨":"",
//        "SuruÌ¤":"Suruc",
//        "åÇ":"",
//        "å£3million":"3 million",
//        "åÀ":""]
//
//    let contractions1: [String:String] = [
//        "he's":"he is",
//        "there's":"there is",
//        "We're":"We are",
//        "That's":"That is",
//        "won't":"will not",
//        "they're":"they are",
//        "Can't":"Cannot",
//        "wasn't":"was not",
//        "don\\x89Ûªt":"do not",
//        "aren't":"are not",
//        "isn't":"is not",
//        "What's":"What is",
//        "haven't":"have not",
//        "hasn't":"has not",
//        "There's": "There is"]
//
//    let contractions2: [String: String] = [
//        "He's": "He is",
//        "It's": "It is",
//        "You're": "You are",
//        "I'M": "I am",
//        "shouldn't": "should not",
//        "wouldn't": "would not"]
//
//    let contractions3: [String: String] = [
//        "i'm": "I am",
//        "I\\x89Ûªm": "I am"]
//
//    let contractions4: [String: String] = [
//        "I'm": "I am",
//        "Isn't": "is not",
//        "Here's": "Here is",
//        "you've": "you have",
//        "you\\x89Ûªve": "you have",
//        "we're": "we are",
//        "what's": "what is",
//        "couldn't": "could not",
//        "we've": "we have",
//        "it\\x89Ûªs": "it is",
//        "doesn\\x89Ûªt": "does not"]
//
//    let contractions5: [String: String] = [
//        "It\\x89Ûªs": "It is",
//        "Here\\x89Ûªs": "Here is",
//        "who's": "who is",
//        "I\\x89Ûªve": "I have",
//        "y'all": "you all",
//        "can\\x89Ûªt": "cannot",
//        "would've": "would have",
//        "it'll": "it will",
//        "we'll": "we will",
//        "wouldn\\x89Ûªt": "would not",
//        "We've": "We have",
//        "he'll": "he will",
//        "Y'all": "You all",
//        "Weren't": "Were not",
//        "Didn't": "Did not",
//        "they'll": "they will",
//        "they'd": "they would",
//        "DON'T": "DO NOT",
//        "That\\x89Ûªs": "That is",
//        "they've": "they have",
//        "i'd": "I would",
//        "should've": "should have",
//        "You\\x89Ûªre": "You are",
//        "where's": "where is",
//        "Don\\x89Ûªt": "Do not",
//        "we'd": "we would",
//        "i'll": "I will"]
//
//    let contractions6: [String: String] = [
//        "weren't": "were not",
//        "They're": "They are",
//        "Can\\x89Ûªt": "Cannot",
//        "you\\x89Ûªll": "you will",
//        "I\\x89Ûªd": "I would",
//        "let's": "let us",
//        "it's": "it is",
//        "can't": "cannot",
//        "don't": "do not",
//        "you're": "you are",
//        "i've": "I have",
//        "that's": "that is",
//        "i'll": "I will",
//        "doesn't": "does not",
//        "i'd": "I would",
//        "didn't": "did not",
//        "ain't": "am not",
//        "you'll": "you will",
//        "I've": "I have",
//        "Don't": "do not",
//        "I'll": "I will"]
//
//    let contractions7: [String: String] = [
//        "I'd": "I would",
//        "Let's": "Let us",
//        "you'd": "You would",
//        "It's": "It is",
//        "Ain't": "am not",
//        "Haven't": "Have not",
//        "Could've": "Could have",
//        "youve": "you have",
//        "donå«t": "do not",]
//
//    let entity: [String:String] = [
//        "&gt;": ">",
//        "&lt;": "<",
//        "&amp;": "&"]
//
//    let types: [String:String] = [
//        "w/e": "whatever",
//        "w/": "with",
//        "USAgov": "USA government",
//        "recentlu": "recently",
//        "Ph0tos": "Photos",
//        "amirite": "am I right",
//        "exp0sed": "exposed",
//        "<3": "love",
//        "amageddon": "armageddon",
//        "Trfc": "Traffic",
//        "8/5/2015": "2015-08-05",
//        "WindStorm": "Wind Storm",
//        "8/6/2015": "2015-08-06",
//        "10:38PM": "10:38 PM",
//        "10:30pm": "10:30 PM",
//        "16yr": "16 year",
//        "lmao": "laughing my ass off",
//        "TRAUMATISED": "traumatized"]
//
//     let acronyms: [String:String] = [
//        "MH370": "Malaysia Airlines Flight 370",
//        "mÌ¼sica": "music",
//        "okwx": "Oklahoma City Weather",
//        "arwx": "Arkansas Weather",
//        "gawx": "Georgia Weather",
//        "scwx": "South Carolina Weather",
//        "cawx": "California Weather",
//        "tnwx": "Tennessee Weather",
//        "azwx": "Arizona Weather",
//        "alwx": "Alabama Weather",
//        "wordpressdotcom": "wordpress",
//        "usNWSgov": "United States National Weather Service",
//        "Suruc": "Sanliurfa"]
//
//     let grouping: [String:String] = [
//        "Bestnaijamade": "bestnaijamade",
//        "SOUDELOR": "Soudelor"]
//
//     let other: [String:String] = [
//        "\\$\\w*": "",
//        "^RT[\\s]+": "",
//        "https?:\\/\\/.*[\r\n]*": "",
//        "#": "",
//        "<.*?>": "",
//        "\\w*\\d\\w*": ""]
//
//    let all: [[String:String]] = [specialCharacters + contractions1 + contractions2 + contractions3 + contractions4 + contractions5 + contractions6 + contractions7 + entity + types + acronyms + grouping + other]
//
//    var currentText: String = text
//    for item in all {
//        for key in item.keys {
//            if let value = item[key] {
//                let regex = re.compile(key)
//                currentText = regex.sub(value, currentText)
//            }
//        }
//    }
//
//    return currentText
//}
//
//func +<Key, Value> (lhs: [Key: Value], rhs: [Key: Value]) -> [Key: Value] {
//     var result = lhs
//     rhs.forEach{ result[$0] = $1 }
//     return result
// }
//
//// Use NSLinguisticTagger to lemmatize utterances
//class Lemmatizer {
//    typealias TaggedToken = (String, String?)
//
//    func tag(text: String, scheme: String) -> [TaggedToken] {
//        let options: NSLinguisticTagger.Options = [.omitWhitespace, .omitPunctuation, .omitOther, .joinNames]
//        let tagger = NSLinguisticTagger(tagSchemes: NSLinguisticTagger.availableTagSchemes(forLanguage: "en"), options: Int(options.rawValue))
//
//        tagger.string = text
//
//        var tokens: [TaggedToken] = []
//
//        tagger.enumerateTags(in: NSMakeRange(0, text.count), scheme:NSLinguisticTagScheme(rawValue: scheme), options: options) { tag, tokenRange, _, _ in
//
//            let token = (text as NSString).substring(with: tokenRange)
//            tokens.append((token, tag?.rawValue))
//        }
//
//        return tokens
//    }
//
//    func lemmatize(text: String) -> [TaggedToken] {
//        return tag(text: text.lowercased(), scheme: NSLinguisticTagScheme.lemma.rawValue)
//    }
//}
//
////
////  re.swift
////  Stoic
////
////  Created by Ritesh Pakala on 12/6/20.
////  Copyright © 2020 Ritesh Pakala. All rights reserved.
////
//
///**
//*  Counterpart of Python's re module, but as a class.
//*/
//public class re {
//  // MARK: - re methods
//  /**
//  Compile a regular expression pattern into a RegexObject object, which can be used for matching using its match() and search() methods, described below.
//
//  See https://docs.python.org/2/library/re.html#re.compile
//
//  - parameter pattern: regular expression pattern string
//  - parameter flags:   NSRegularExpressionOptions value
//
//  - returns: The created RegexObject object. If the pattern is invalid, RegexObject.isValid is false, and all methods have a default return value.
//  */
//  public static func compile(_ pattern: String, flags: RegexObject.Flag = []) -> RegexObject {
//    return RegexObject(pattern: pattern, flags: flags)
//  }
//
//  /**
//  Scan through string looking for the first location where the regular expression pattern produces a match, and return a corresponding MatchObject instance.
//
//  See https://docs.python.org/2/library/re.html#re.search
//
//  - parameter pattern: regular expression pattern string
//  - parameter string:  string to be searched
//  - parameter flags:   NSRegularExpressionOptions value
//
//  - returns: Corresponding MatchObject instance. Return nil if no position in the string matches the pattern or pattern is invalid; note that this is different from finding a zero-length match at some point in the string.
//  */
//  public static func search(_ pattern: String, _ string: String, flags: RegexObject.Flag = []) -> MatchObject? {
//    return re.compile(pattern, flags: flags).search(string)
//  }
//
//  /**
//  If zero or more characters at the beginning of string match the regular expression pattern, return a corresponding MatchObject instance.
//
//  See https://docs.python.org/2/library/re.html#re.match
//
//  - parameter pattern: regular expression pattern string
//  - parameter string:  string to be searched
//  - parameter flags:   NSRegularExpressionOptions value
//
//  - returns: Corresponding MatchObject instance. Return nil if the string does not match the pattern or pattern is invalid; note that this is different from a zero-length match.
//  */
//  public static func match(_ pattern: String, _ string: String, flags: RegexObject.Flag = []) -> MatchObject? {
//    return re.compile(pattern, flags: flags).match(string)
//  }
//
//  /**
//  Split string by the occurrences of pattern. If capturing parentheses are used in pattern, then the text of all groups in the pattern are also returned as part of the resulting list. If maxsplit is nonzero, at most maxsplit splits occur, and the remainder of the string is returned as the final element of the list.
//
//  See https://docs.python.org/2/library/re.html#re.split
//
//  - parameter pattern:  regular expression pattern string
//  - parameter string:   string to be splitted
//  - parameter maxsplit: maximum number of times to split the string, defaults to 0, meaning no limit is applied
//  - parameter flags:    NSRegularExpressionOptions value
//
//  - returns: Array of splitted strings
//  */
//  public static func split(_ pattern: String, _ string: String, _ maxsplit: Int = 0, flags: RegexObject.Flag = []) -> [String?] {
//    return re.compile(pattern, flags: flags).split(string, maxsplit)
//  }
//
//  /**
//  Return all non-overlapping matches of pattern in string, as a list of strings. The string is scanned left-to-right, and matches are returned in the order found. Empty matches are included in the result unless they touch the beginning of another match.
//
//  See https://docs.python.org/2/library/re.html#re.findall
//
//  - parameter pattern: regular expression pattern string
//  - parameter string:  string to be searched
//  - parameter flags:   NSRegularExpressionOptions value
//
//  - returns: Array of matched substrings
//  */
//  public static func findall(_ pattern: String, _ string: String, flags: RegexObject.Flag = []) -> [String] {
//    return re.compile(pattern, flags: flags).findall(string)
//  }
//
//  /**
//  Return an array of MatchObject instances over all non-overlapping matches for the RE pattern in string. The string is scanned left-to-right, and matches are returned in the order found. Empty matches are included in the result unless they touch the beginning of another match.
//
//  See https://docs.python.org/2/library/re.html#re.finditer
//
//  - parameter pattern: regular expression pattern string
//  - parameter string:  string to be searched
//  - parameter flags:   NSRegularExpressionOptions value
//
//  - returns: Array of match results as MatchObject instances
//  */
//  public static func finditer(_ pattern: String, _ string: String, flags: RegexObject.Flag = []) -> [MatchObject] {
//    return re.compile(pattern, flags: flags).finditer(string)
//  }
//
//  /**
//  Return the string obtained by replacing the leftmost non-overlapping occurrences of pattern in string by the replacement repl. If the pattern isn’t found, string is returned unchanged. Different from python, passing a repl as a closure is not supported.
//
//  See https://docs.python.org/2/library/re.html#re.sub
//
//  - parameter pattern: regular expression pattern string
//  - parameter repl:    replacement string
//  - parameter string:  string to be searched and replaced
//  - parameter count:   maximum number of times to perform replace operations to the string
//  - parameter flags:   NSRegularExpressionOptions value
//
//  - returns: replaced string
//  */
//  public static func sub(_ pattern: String, _ repl: String, _ string: String, _ count: Int = 0, flags: RegexObject.Flag = []) -> String {
//    return re.compile(pattern, flags: flags).sub(repl, string, count)
//  }
//
//  /**
//  Perform the same operation as sub(), but return a tuple (new_string, number_of_subs_made) as (String, Int)
//
//  See https://docs.python.org/2/library/re.html#re.subn
//
//  - parameter pattern: regular expression pattern string
//  - parameter repl:    replacement string
//  - parameter string:  string to be searched and replaced
//  - parameter count:   maximum number of times to perform replace operations to the string
//  - parameter flags:   NSRegularExpressionOptions value
//
//  - returns: a tuple (new_string, number_of_subs_made) as (String, Int)
//  */
//  public static func subn(_ pattern: String, _ repl: String, _ string: String, _ count: Int = 0, flags: RegexObject.Flag = []) -> (String, Int) {
//    return re.compile(pattern, flags: flags).subn(repl, string, count)
//  }
//
//  // MARK: - RegexObject
//  /**
//  *  Counterpart of Python's re.RegexObject
//  */
//  public class RegexObject {
//    /// Typealias for NSRegularExpressionOptions
//    public typealias Flag = NSRegularExpression.Options
//
//    /// Whether this object is valid or not
//    public var isValid: Bool {
//      return regex != nil
//    }
//
//    /// Pattern used to construct this RegexObject
//    public let pattern: String
//
//    private let regex: NSRegularExpression?
//
//    /// Underlying NSRegularExpression Object
//    public var nsRegex: NSRegularExpression? {
//      return regex
//    }
//
//    /// NSRegularExpressionOptions used to contructor this RegexObject
//    public var flags: Flag {
//      return regex?.options ?? []
//    }
//
//    /// Number of capturing groups
//    public var groups: Int {
//      return regex?.numberOfCaptureGroups ?? 0
//    }
//
//    /**
//    Create A re.RegexObject Instance
//
//    - parameter pattern: regular expression pattern string
//    - parameter flags:   NSRegularExpressionOptions value
//
//    - returns: The created RegexObject object. If the pattern is invalid, RegexObject.isValid is false, and all methods have a default return value.
//    */
//    public required init(pattern: String, flags: Flag = []) {
//      self.pattern = pattern
//      do {
//        self.regex = try NSRegularExpression(pattern: pattern, options: flags)
//      } catch let error as NSError {
//        self.regex = nil
//        debugPrint(error)
//      }
//    }
//
//    /**
//    Scan through string looking for a location where this regular expression produces a match, and return a corresponding MatchObject instance. Return nil if no position in the string matches the pattern; note that this is different from finding a zero-length match at some point in the string.
//
//    See https://docs.python.org/2/library/re.html#re.RegexObject.search
//
//    - parameter string:  string to be searched
//    - parameter pos:     position in string where the search is to start, defaults to 0
//    - parameter endpos:  position in string where the search it to end (non-inclusive), defaults to nil, meaning the end of the string. If endpos is less than pos, no match will be found.
//    - parameter options: NSMatchOptions value
//
//    - returns: search result as MatchObject instance if a match is found, otherwise return nil
//    */
//    public func search(_ string: String, _ pos: Int = 0, _ endpos: Int? = nil, options: NSRegularExpression.MatchingOptions = []) -> MatchObject? {
//      guard let regex = regex else {
//        return nil
//      }
//      let start = pos > 0 ?pos :0
//      let end = endpos ?? string.utf16.count
//      let length = max(0, end - start)
//      let range = NSRange(location: start, length: length)
//      if let match = regex.firstMatch(in: string, options: options, range: range) {
//        return MatchObject(string: string, match: match)
//      }
//      return nil
//    }
//
//    /**
//    If zero or more characters at the beginning of string match this regular expression, return a corresponding MatchObject instance. Return nil if the string does not match the pattern; note that this is different from a zero-length match.
//
//    See https://docs.python.org/2/library/re.html#re.RegexObject.match
//
//    - parameter string:  string to be matched
//    - parameter pos:     position in string where the search is to start, defaults to 0
//    - parameter endpos:  position in string where the search it to end (non-inclusive), defaults to nil, meaning the end of the string. If endpos is less than pos, no match will be found.
//
//    - returns: match result as MatchObject instance if a match is found, otherwise return nil
//    */
//    public func match(_ string: String, _ pos: Int = 0, _ endpos: Int? = nil) -> MatchObject? {
//      return search(string, pos, endpos, options: [.anchored])
//    }
//
//    /**
//    Identical to the re.split() function, using the compiled pattern.
//
//    See https://docs.python.org/2/library/re.html#re.RegexObject.split
//
//    - parameter string:   string to be splitted
//    - parameter maxsplit: maximum number of times to split the string, defaults to 0, meaning no limit is applied
//
//    - returns: Array of splitted strings
//    */
//    public func split(_ string: String, _ maxsplit: Int = 0) -> [String?] {
//      guard let regex = regex else {
//        return []
//      }
//      var splitsLeft = maxsplit == 0 ? Int.max : (maxsplit < 0 ? 0 : maxsplit)
//      let range = NSRange(location: 0, length: string.utf16.count)
//      var results = [String?]()
//      var start = string.startIndex
//      var end = string.startIndex
//      regex.enumerateMatches(in: string, options: [], range: range) { result, _, stop in
//        if splitsLeft <= 0 {
//          stop.pointee = true
//          return
//        }
//
//        guard let result = result, result.range.length > 0 else {
//          return
//        }
//
//        end = string.index(string.startIndex, offsetBy: result.range.location)
//        results.append(String(string[start..<end]))
//        if regex.numberOfCaptureGroups > 0 {
//          results += MatchObject(string: string, match: result).groups()
//        }
//        splitsLeft -= 1
//        start = string.index(end, offsetBy: result.range.length)
//      }
//      if start <= string.endIndex {
//        results.append(String(string[start..<string.endIndex]))
//      }
//      return results
//    }
//
//    /**
//    Similar to the re.findall() function, using the compiled pattern, but also accepts optional pos and endpos parameters that limit the search region like for match().
//
//    See https://docs.python.org/2/library/re.html#re.RegexObject.findall
//
//    - parameter string:  string to be matched
//    - parameter pos:     position in string where the search is to start, defaults to 0
//    - parameter endpos:  position in string where the search it to end (non-inclusive), defaults to nil, meaning the end of the string. If endpos is less than pos, no match will be found.
//
//    - returns: Array of matched substrings
//    */
//    public func findall(_ string: String, _ pos: Int = 0, _ endpos: Int? = nil) -> [String] {
//      return finditer(string, pos, endpos).map { $0.group()! }
//    }
//
//    /**
//    Similar to the re.finditer() function, using the compiled pattern, but also accepts optional pos and endpos parameters that limit the search region like for match().
//
//    https://docs.python.org/2/library/re.html#re.RegexObject.finditer
//
//    - parameter string:  string to be matched
//    - parameter pos:     position in string where the search is to start, defaults to 0
//    - parameter endpos:  position in string where the search it to end (non-inclusive), defaults to nil, meaning the end of the string. If endpos is less than pos, no match will be found.
//
//    - returns: Array of match results as MatchObject instances
//    */
//    public func finditer(_ string: String, _ pos: Int = 0, _ endpos: Int? = nil) -> [MatchObject] {
//      guard let regex = regex else {
//        return []
//      }
//      let start = pos > 0 ?pos :0
//      let end = endpos ?? string.utf16.count
//      let length = max(0, end - start)
//      let range = NSRange(location: start, length: length)
//      return regex.matches(in: string, options: [], range: range).map { MatchObject(string: string, match: $0) }
//    }
//
//    /**
//    Identical to the re.sub() function, using the compiled pattern.
//
//    See https://docs.python.org/2/library/re.html#re.RegexObject.sub
//
//    - parameter repl:    replacement string
//    - parameter string:  string to be searched and replaced
//    - parameter count:   maximum number of times to perform replace operations to the string
//
//    - returns: replaced string
//    */
//    public func sub(_ repl: String, _ string: String, _ count: Int = 0) -> String {
//      return subn(repl, string, count).0
//    }
//
//    /**
//    Identical to the re.subn() function, using the compiled pattern.
//
//    See https://docs.python.org/2/library/re.html#re.RegexObject.subn
//
//    - parameter repl:    replacement string
//    - parameter string:  string to be searched and replaced
//    - parameter count:   maximum number of times to perform replace operations to the string
//
//    - returns: a tuple (new_string, number_of_subs_made) as (String, Int)
//    */
//    public func subn(_ repl: String, _ string: String, _ count: Int = 0) -> (String, Int) {
//      guard let regex = regex else {
//        return (string, 0)
//      }
//      let range = NSRange(location: 0, length: string.utf16.count)
//      let mutable = NSMutableString(string: string)
//      let maxCount = count == 0 ? Int.max : (count > 0 ? count : 0)
//      var n = 0
//      var offset = 0
//      regex.enumerateMatches(in: string, options: [], range: range) { result, _, stop in
//        if maxCount <= n {
//          stop.pointee = true
//          return
//        }
//        if let result = result {
//          n += 1
//          let resultRange = NSRange(location: result.range.location + offset, length: result.range.length)
//          let lengthBeforeReplace = mutable.length
//          regex.replaceMatches(in: mutable, options: [], range: resultRange, withTemplate: repl)
//          offset += mutable.length - lengthBeforeReplace
//        }
//      }
//      return (mutable as String, n)
//    }
//  }
//
//  // MARK: - MatchObject
//  /**
//  *  Counterpart of Python's re.MatchObject
//  */
//  public final class MatchObject {
//    /// String matched
//    public let string: String
//
//    /// Underlying NSTextCheckingResult
//    public let match: NSTextCheckingResult
//
//    init(string: String, match: NSTextCheckingResult) {
//      self.string = string
//      self.match = match
//    }
//
//    /**
//    Return the string obtained by doing backslash substitution on the template string template, as done by the sub() method.
//
//    Note that named backreferences in python is not supported here since NSRegularExpression does not have this feature.
//
//    See https://docs.python.org/2/library/re.html#re.MatchObject.expand
//
//    - parameter template: regular expression template decribing the expanded format
//
//    - returns: expanded string
//    */
//    public func expand(_ template: String) -> String {
//      guard let regex = match.regularExpression else {
//        return ""
//      }
//      return regex.replacementString(for: match, in: string, offset: 0, template: template)
//    }
//
//    /**
//    Returns one subgroup of the match. If the group number is negative or larger than the number of groups defined in the pattern, nil returned. If a group is contained in a part of the pattern that did not match, the corresponding result is nil. If a group is contained in a part of the pattern that matched multiple times, the last match is returned.
//
//    Note that different from python's group function this function does not accept multiple arguments due to ambiguous syntax. If you would like to use multiple arguments pass in an array instead.
//
//    See https://docs.python.org/2/library/re.html#re.MatchObject.group
//
//    - parameter index: group index, defaults to 0, meaning the entire matching string
//
//    - returns: string of the matching group
//    */
//    public func group(_ index: Int = 0) -> String? {
//      guard let range = span(index), range.lowerBound < string.endIndex else {
//        return nil
//      }
//      return String(string[range])
//    }
//
//    /**
//    Returns one or more subgroups of the match. If a group number is negative or larger than the number of groups defined in the pattern, nil is inserted at the relevant index of the returned array. If a group is contained in a part of the pattern that did not match, the corresponding result is None. If a group is contained in a part of the pattern that matched multiple times, the last match is returned.
//
//    See https://docs.python.org/2/library/re.html#re.MatchObject.group
//
//    - parameter indexes: array of group indexes to get
//
//    - returns: array of strings of the matching groups
//    */
//    public func group(_ indexes: [Int]) -> [String?] {
//      return indexes.map { group($0) }
//    }
//
//    /**
//    Return an array containing all the subgroups of the match, from 1 up to however many groups are in the pattern. The default argument is used for groups that did not participate in the match.
//
//    Note that python version of this function returns a tuple while this one returns an array due to the fact that swift cannot specify a variadic tuple as return value.
//
//    See https://docs.python.org/2/library/re.html#re.MatchObject.groups
//
//    - parameter defaultValue: default value string
//
//    - returns: array of all matching subgroups as String
//    */
//    public func groups(_ defaultValue: String) -> [String] {
//      return (1..<match.numberOfRanges).map { group($0) ?? defaultValue }
//    }
//
//    /**
//    Return an array containing all the subgroups of the match, from 1 up to however many groups are in the pattern. For groups that did not participate in the match, nil is inserted at the relevant index of the return array.
//
//    Note that python version of this function returns a tuple while this one returns an array due to the fact that swift cannot specify a variadic tuple as return value.
//
//    See https://docs.python.org/2/library/re.html#re.MatchObject.groups
//
//    - returns: array of all matching subgroups as String? (nil when relevant optional capture group is not matched)
//    */
//    public func groups() -> [String?] {
//      return (1..<match.numberOfRanges).map { group($0) }
//    }
//
//    /**
//    Return the range of substring matched by group; group defaults to zero (meaning the whole matched substring). Return nil if paremeter is invalid or group exists but did not contribute to the match.
//
//    See https://docs.python.org/2/library/re.html#re.MatchObject.span
//
//    - parameter index: group index
//
//    - returns: range of matching group substring
//    */
//    public func span(_ index: Int = 0) -> Range<String.Index>? {
//      if index >= match.numberOfRanges {
//        return nil
//      }
//      let nsrange = match.range(at: index)
//
//      if nsrange.location == NSNotFound {
//        return string.endIndex..<string.endIndex
//      }
//      let startIndex16 = string.utf16.index(string.startIndex, offsetBy: nsrange.location)
//      let endIndex16 = string.utf16.index(startIndex16, offsetBy: nsrange.length)
//      return (String.Index(startIndex16, within: string) ?? string.endIndex)..<(String.Index(endIndex16, within: string) ?? string.endIndex)
//    }
//  }
//}
