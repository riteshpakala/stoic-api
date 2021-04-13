//
//  File.swift
//  
//
//  Created by Ritesh Pakala on 4/12/21.
//

import Foundation
import Vapor

public struct Security: Codable {
    let value: Double
    let volume: Double
    let high: Double
    let low: Double
    let dateEpoch: Double
    let dateAsString: String
    
    var date: Date {
        dateEpoch.date()
    }
}

public struct Securities: Codable {
    let data: [Security]
}

final class SecurityResult: Content {
    static let schema = "SecurityResult"
    
    let predictions: [PredictionResult]
    
    init(predictions: [PredictionResult]) {
        self.predictions = predictions
    }
}

final class PredictionResult: Content {
    static let schema = "PredictionResult"
    
    let daysEMA: Int
    let daysSMA: Int
    let dataSize: Int
    let value: Double
    
    init(dataSize: Int, daysEMA: Int, daysSMA: Int, value: Double) {
        self.dataSize = dataSize
        self.daysEMA = daysEMA
        self.daysSMA = daysSMA
        self.value = value
    }
}
