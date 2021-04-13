//
//  StockKitModels.swift
//  Stoic
//
//  Created by Ritesh Pakala on 7/28/20.
//  Copyright © 2020 Ritesh Pakala. All rights reserved.
//
import Foundation

open class Archiveable: Codable {}
extension Archiveable {
    
}

extension Data {
    public var model: StockKitModels? {
        let jsonDecoder: JSONDecoder = .init()
        do {
            return try jsonDecoder.decode(StockKitModels.self, from: self)
        } catch let error {
            print("{CoreData} \(error)")
        }
        
        return nil
    }
    
    public var dataSet: [String:[Double]]? {
        let jsonDecoder: JSONDecoder = .init()
        do {
            return try jsonDecoder.decode([String:[Double]].self, from: self)
        } catch let error {
            print("{CoreData} \(error)")
        }
        
        return nil
    }
    
    public var metadata: [String:String]? {
        let jsonDecoder: JSONDecoder = .init()
        do {
            return try jsonDecoder.decode([String:String].self, from: self)
        } catch let error {
            print("{CoreData} \(error)")
        }
        
        return nil
    }
}

public class StockKitModels: Archiveable {
//    public static var supportsSecureCoding: Bool = true
    
    public static let engine: String = "david.v00.01.10"

//    var open: Double
//    var high: Double
//    var low: Double
//    var close: Double
//    var adjClose: Double //X-Dividend
//    var volume: Double
    
    public enum Model {
        case open(SVMModel)
        case close(SVMModel)
        case high(SVMModel)
        case low(SVMModel)
        case volume(SVMModel)
        
        var type: ModelType {
            switch self {
            case .open(_):
                return .open
            case .close(_):
                return .close
            case .high(_):
                return .high
            case .low(_):
                return .low
            case .volume(_):
                return .volume
            }
        }
        
        var model: SVMModel {
            switch self {
            case .open(let model):
                return model
            case .close(let model):
                return model
            case .high(let model):
                return model
            case .low(let model):
                return model
            case .volume(let model):
                return model
            }
        }
    }
    
    public enum ModelType: Int, CaseIterable {
        case open
        case close
        case high
        case low
        case volume
        case none
        
        var inDim: Int {
            switch self {
            case .volume:
                return 5
            default:
                return 7
            }
        }
        
        func model(for model: SVMModel) -> Model {
            switch self {
            case .open:
                return .open(model)
            case .close, .none:
                return .close(model)
            case .high:
                return .high(model)
            case .low:
                return .low(model)
            case .volume:
                return .volume(model)
            }
        }
        
        var symbol: String {
            switch self {
            case .volume:
                return ""
            default:
                return "$"
            }
        }
        
        public static func forValue(_ string: String) -> ModelType {
            for type in ModelType.allCases {
                if "\(type)" == string {
                    return type
                }
            }
            
            return .none
        }
    }
    
    struct LastPrediction {
        let positive: Double = 0.5
        let negative: Double = 0.5
        let neutral: Double = 0.0
        let compound: Double = 0.0
    }
    
    public var open: SVMModel?
    public var close: SVMModel?
    public var high: SVMModel?
    public var low: SVMModel?
    public var volume: SVMModel?
    
    public var currentType: ModelType = .open
    public var current: SVMModel? {
        switch currentType {
        case .open:
            return open
        case .close, .none:
            return close
        case .high:
            return high
        case .low:
            return low
        case .volume:
            return volume
        }
    }
    public func modelType(forModel model: SVMModel) -> ModelType {
        switch model {
        case open:
            return .open
        case close:
            return .close
        case high:
            return .high
        case low:
            return .low
        case volume:
            return .volume
        default:
            return .none
        }
    }
    public func model(forType type: ModelType) -> SVMModel? {
        switch type {
        case .open:
            return open
        case .close:
            return close
        case .high:
            return high
        case .low:
            return low
        case .volume:
            return volume
        default:
            return close
        }
    }
    
    public init(models: [Model]) {
        for model in models {
            switch model {
            case .open(let svmModel):
                open = svmModel
            case .close(let svmModel):
                close = svmModel
            case .high(let svmModel):
                high = svmModel
            case .low(let svmModel):
                low = svmModel
            case .volume(let svmModel):
                volume = svmModel
            }
        }
        super.init()
    }
    
    enum CodingKeys: String, CodingKey {
        case open
        case close
        case high
        case low
        case volume
        case currentType
    }
    
    required public convenience init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        let openModel: SVMModel = try container.decode(SVMModel.self, forKey: .open)
//        let open: SVMModel? = try? NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(openModel) as? SVMModel
        
        let closeModel: SVMModel = try container.decode(SVMModel.self, forKey: .close)
//        let close: SVMModel? = try? NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(closeModel) as? SVMModel
        
        let highModel: SVMModel = try container.decode(SVMModel.self, forKey: .high)
//        let high: SVMModel? = try? NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(highModel) as? SVMModel
        
        let lowModel: SVMModel = try container.decode(SVMModel.self, forKey: .low)
//        let low: SVMModel? = try? NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(lowModel) as? SVMModel
        
        let volumeModel: SVMModel = try container.decode(SVMModel.self, forKey: .volume)
//        let volume: SVMModel? = try? NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(volumeModel) as? SVMModel
        
        let typeValue: Int = try container.decode(Int.self, forKey: .currentType)
        
        self.init(
            models: [])
        
        self.open = openModel
        self.close = closeModel
        self.high = highModel
        self.low = lowModel
        self.volume = volumeModel
        self.currentType = ModelType.init(rawValue: typeValue) ?? .none
    }
    
    public override func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        if let open = self.open, let close = self.close, let high = self.high, let low = self.low, let volume = self.volume {
            try container.encode(open, forKey: .open)
            
            try container.encode(close, forKey: .close)
            
            try container.encode(high, forKey: .high)
            
            try container.encode(low, forKey: .low)
            
            try container.encode(volume, forKey: .volume)
            
            try container.encode(currentType.rawValue, forKey: .currentType)
        }
    }
}
