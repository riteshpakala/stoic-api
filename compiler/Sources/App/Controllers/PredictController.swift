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


var service = BackendService()

struct PredictController: RouteCollection {
    let loopGroup: EventLoopGroup
    
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

        
        if let model = service.models.first(where: { $0.symbol ==  symbol}) {
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
            
            models.close?.predictValues(data: testData)
            
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
