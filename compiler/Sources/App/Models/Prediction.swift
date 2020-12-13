import Fluent
import Vapor

final class Prediction: Content {
    static let schema = "prediction"
    
    var id: UUID?

    var prediction: String
    
    let nextTradingDate: String
    let daysTrained: String
    let sentimentStrength: String
    
    let type: String

    init(id: UUID = UUID(), prediction: String, metadata: Data, type: String) {
        self.id = id
        self.prediction = prediction
        
        let data = metadata.metadata
        self.nextTradingDate = data?["nextTradingDate"] ?? ""
        self.daysTrained = data?["daysTrained"] ?? ""
        self.sentimentStrength = data?["sentimentStrength"] ?? ""
        
        self.type = type
        
    }
}
