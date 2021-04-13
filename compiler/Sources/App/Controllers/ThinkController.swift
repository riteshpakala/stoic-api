//
//  File.swift
//  
//
//  Created by Ritesh Pakala on 4/12/21.
//

import Foundation
import Fluent
import Vapor
import Core
import Storage
import Datastore

struct ThinkController: RouteCollection {
    let loopGroup: EventLoopGroup
    
    let stoicSentiment: VaderSentiment = .init()
    
    init(loopGroup: EventLoopGroup) {
        self.loopGroup = loopGroup
//        service.gcs = backend
    }
    
    func boot(routes: RoutesBuilder) throws {
        let todos = routes.grouped("think")
//        todos.get(use: index)
        
        todos.group("generate") { todo in
            todo.on(.POST, body: .collect(maxSize: 500000), use: think)
        }
    }
    
    func think(req: Request) throws -> EventLoopFuture<SecurityResult> {
        let promise = loopGroup.next().makePromise(of: SecurityResult.self)
        let contentType = req.headers["Content-Type"]
        if let body = req.body.string {
            do {
                if let data = body.data(using: .utf8) {
                    try autoreleasepool {
                        let securities = try JSONDecoder().decode(Securities.self, from: data)
                        
                        //let indicators = Indicators.init(with: securities.data)
                        //print(securities.data.count)
                        let result = ThinkController.compilePrediction(securities: securities.data)
                        
                        promise.completeWith(.init(catching: {
                            result
                        }))
                    }
                }
            } catch let error {
                print(error)
            }
        }
        
        return promise.futureResult
    }
    
    public static func compilePrediction(securities: [Security]) -> SecurityResult {
        let minDays: Int = 4
        let maxDays: Int = 28
        
        var predictions: [PredictionResult] = []
        for iter in 0..<9 {
            predictions.append(generate(fromQuote: securities, indicatorDays: minDays...maxDays))
            
        }
        
        return .init(predictions: predictions)
    }
    
    
    public static func generate(fromQuote quoteToUse: [Security],
                                indicatorDays: ClosedRange<Int>) -> PredictionResult {
        let securities = quoteToUse.sortAsc
        let dataSize = 30
        
        //Securities part of window of days
        
        print("generating tonal model w/o sentiment: \(securities.count) securities discovered")
        
        let dataForDavid: DataSet = DataSet(
            dataType: .Regression,
            inputDimension: 6,
            outputDimension: 1)
        
        let daysForEMA = Int.random(in: indicatorDays)
        let daysForSMA = Int.random(in: indicatorDays)
        for index in 0..<dataSize {
            do {
                //we add a +1 to days, because we are going to predict from the
                //latest received stock. So we train the model upto the target date
                //
                //in this case the "target date/security" is the latest stock in
                //the quote received in the post request
                let trainable = securities.prefix(upTo: securities.count - (dataSize - index))
                let dataSet = SecurityDataSet(quote: Array(trainable),
                                              context: .close)
                print(dataSet.asString)
                let dataInput = dataSet.asArray
                try dataForDavid.addDataPoint(
                    input: dataSet.asArrayIMBHS(daysForEMA, daysForSMA),
                    output: dataSet.output,
                    label: trainable.last?.dateAsString ?? "\(index)")
                
            }
            catch {
                print("invalid dataSet")
            }
        }
        print("training")
        let david = SVMModel(
            problemType: .ϵSVMRegression,
            kernelSettings:
            KernelParameters(type: .Polynomial,
                             degree: 3,
                             gamma: 0.3,
                             coef0: 0.0))

        david.Cost = 1e3
        david.train(data: dataForDavid)
        
        print("tonal model generation - complete - ✅")
        
        let prediction = predict(model: david, fromQuote: quoteToUse)
        
        return .init(dataSize: dataSize, daysEMA: daysForEMA, daysSMA: daysForSMA, value: prediction)
    }
    
    public static func predict(model: SVMModel,
                               fromQuote quote: [Security]) -> Double {
        
        
        let securities = Array(quote.sortDesc.suffix(from: 1))
        
        let dataForDavid: DataSet = DataSet(
            dataType: .Regression,
            inputDimension: 6,
            outputDimension: 1)
        
        
        do {
            let dataSet = SecurityDataSet(quote: securities,
                                          context: .close)
            
            print(dataSet.asString)
            try dataForDavid.addDataPoint(
                input: dataSet.asArray,
                output: dataSet.output,
                label: securities.last?.dateAsString ?? "\(index)")
            
        }
        catch {
            print("invalid dataSet")
        }
        
        model.predictValues(data: dataForDavid)
        guard let output = dataForDavid.singleOutput(index: 0) else {
            print("prediction failed")
            return 0.0
        }
        
        return output
        
        print("prediction: \(output)")
    }
}
