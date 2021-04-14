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
                    let securities = try JSONDecoder().decode(Securities.self, from: data)
                    
                    //let indicators = Indicators.init(with: securities.data)
                    //print(securities.data.count)
                    let result = ThinkController.compilePrediction(securities: securities.data)
                    
                    promise.completeWith(.init(catching: {
                        result
                    }))
                }
            } catch let error {
                print(error)
            }
        }
        
        return promise.futureResult
    }
    
    public static func compilePrediction(securities: [Security]) -> SecurityResult {
        let minDays: Int = Defaults.minDays
        let maxDays: Int = Defaults.indicatorMaxDays
        
        let indicators: [Indicators.Variant] = [
            .smawa,
            .emawa,
            .macd,
            .stochd,
            .volchange
        ]
        
        
        var result: [SecurityPredictionResult] = []
        var predictionsFlattened: [IndicatorPredictedResult] = []
        for iter in 0..<9 {
//            let range = minDays...maxDays
            let dataSize = Int.random(in: minDays...Defaults.trainingMaxDays)
            
            var predictions: [PredictionResult] = []
            var lastPred: Double = 0.0
            for variant1 in indicators {
                
                let pred = generate(fromQuote: securities,
                                      dataSize: dataSize,
                                      indicatorDays: minDays...maxDays,
                                      indicator1: variant1,
                                      indicator2: .smawa)
                predictions.append(pred)
                
                lastPred = pred.value
            
            }
            
            let predDefault: [IndicatorPredictedResult] = Defaults.indicators.map{ .init(indicator: [.init(title: "\($0)", days: dataSize)], value: lastPred) }
            //defaults
            predictionsFlattened.append(contentsOf: predDefault)
            
            result.append(.init(predictions: predictions, dataSize: dataSize))
        }
        
        var errorPages: [[NodePath]] = []
        var nodePages: [[Node]] = []
        var daysPages: [[String: Int]] = []
        var dataSizes: [Int] = []
        for item in result {
            var nodes: [Node] = []
            var errors: [NodePath] = []
            var days: [String: Int] = [:]
            for subItem in item.predictions {
                for indicator in subItem.indicators {
                    let error = (subItem.value - subItem.comparable.value(forContext: .close)) / subItem.comparable.value(forContext: .close)
                    
                    let nodesDefault: [Node] = Defaults.indicators.map{ .init(source: "\($0)", target: indicator.title) }
                    
                    nodes.append(contentsOf: nodesDefault)
                    
                    errors.append(.init(nodes: nodes, error: error))
                    
                    days[indicator.title] = indicator.days
                }
            }
            dataSizes.append(item.dataSize)
            daysPages.append(days)
            errorPages.append(errors)
            nodePages.append(nodes)
        }
        
        let colors: [String: NodeMeta] = [
            "\(Indicators.Variant.smawa)": .init(label: "SMA Weighted Avg.", color: "#EC6CFF"),
            "\(Indicators.Variant.emawa)": .init(label: "EMA Weighted Avg.", color: "#FFCD00"),
            "\(Indicators.Variant.macd)": .init(label: "MacD", color: "#6cb8ff"),
            "\(Indicators.Variant.stochd)": .init(label: "Stochastic D", color: "#ff896c"),
            "\(Indicators.Variant.volchange)": .init(label: "Volume Change", color: "#6eff55"),
            "\(Indicators.Variant.volatility)": .init(label: "Volatility Average", color: "#a19a8e"),
            "\(Indicators.Variant.momentum)": .init(label: "Momentum", color: "#a19a8e"),
            "\(Indicators.Variant.change)": .init(label: "Change", color: "#a19a8e"),
            "\(Indicators.Variant.vwa)": .init(label: "Volume Weighted Avg.", color: "#a19a8e")
        ]
        
        return .init(result: result,
                     graph: .init(meta: colors,
                                  nodes: nodePages),
                     errors: .init(paths: errorPages),
                     dataSizes: dataSizes,
                     daysPages: daysPages,
                     chart: .init(minX: Defaults.minDays, maxX: Defaults.indicatorMaxDays, labels: Array(colors.keys), data: predictionsFlattened))
    }
    
    
    public static func generate(fromQuote quoteToUse: [Security],
                                dataSize: Int = 30,
                                indicatorDays: ClosedRange<Int>,
                                indicator1: Indicators.Variant,
                                indicator2: Indicators.Variant) -> PredictionResult {
        let securities = quoteToUse.sortAsc
        
        let time = Date().timeIntervalSinceNow
        //Securities part of window of days
        
        print("generating tonal model w/o sentiment: \(securities.count) securities discovered")
        
        let dataForDavid: DataSet = DataSet(
            dataType: .Regression,
            inputDimension: 6,
            outputDimension: 1)
        
        let days1 = Int.random(in: indicatorDays)
        let days2 = Int.random(in: indicatorDays)
        
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
                
                let dataInput = dataSet.asArrayIMBHS(indicator1, indicator2, days1: days1, days2: days2, daysO: dataSize)
                
//                print(dataSet.indicators.macDAverage(days1, context: .close))
//                print(dataInput)
                try dataForDavid.addDataPoint(
                    input: dataInput,
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
        
        print("tonal model generation - complete - ✅ - \(Date().timeIntervalSinceNow - time)")
        
        let quoteSorted = quoteToUse.sortDesc
        
        guard let comparable = quoteSorted.first else {
            fatalError("failed to get quoteSorted first element")
        }
        
        let prediction = predict(model: david,
                                 fromQuote: quoteSorted,
                                 indicator1: indicator1,
                                 indicator2: indicator2,
                                 days1,
                                 days2,
                                 dataSize)
//        print(prediction)
        return .init(comparable: comparable,
                     dataSize: dataSize,
                     indicator1: indicator1,
                     indicator2: indicator2,
                     days1: days1,
                     days2: days2,
                     value: prediction,
                     time: Date().timeIntervalSinceNow - time)
    }
    
    public static func predict(model: SVMModel,
                               fromQuote quote: [Security],
                               indicator1: Indicators.Variant,
                               indicator2: Indicators.Variant,
                               _ days1: Int,
                               _ days2: Int,
                               _ daysO: Int) -> Double {
        
        
        let securities = Array(quote.suffix(from: 1))
        
        let dataForDavid: DataSet = DataSet(
            dataType: .Regression,
            inputDimension: 6,
            outputDimension: 1)
        
        
        do {
            let dataSet = SecurityDataSet(quote: securities,
                                          context: .close)
            
            try dataForDavid.addDataPoint(
                input: dataSet.asArrayIMBHS(indicator1, indicator2, days1: days1, days2: days2, daysO: daysO),
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
