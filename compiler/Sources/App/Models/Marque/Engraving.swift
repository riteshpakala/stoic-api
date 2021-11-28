//
//  File.swift
//  
//
//  Created by Ritesh Pakala on 11/26/21.
//

import Foundation
import Vapor

public struct Engraving: Content {
    let photo: Data
    let message: String
}

public struct EngravingResult: Content {
    static let schema = "EngravingResult"
    
    let output: String
    let data: [UInt32]
    
    public init(output: String, data: [UInt32] = []) {
        self.output = output
        self.data = data
    }
}

public struct Process: Content {
    let photo: Data
}

public struct ProcessResult: Content {
    static let schema = "ProcessResult"
    
    let output: String
    
    public init(output: String) {
        self.output = output
    }
}
