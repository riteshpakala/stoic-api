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
    let address: String
}

public struct EngravingResult: Content {
    static let schema = "EngravingResult"
    
    let output: String
}
