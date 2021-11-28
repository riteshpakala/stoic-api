//
//  Defaults.swift
//  SwiftStego
//
//  Created by Brian Hans on 1/13/18.
//  Copyright © 2018 BrianHans. All rights reserved.
//

import Foundation

struct DefaultsMarque {
  static let initalShift = 7
  static let bytesPerPixel = 4
  static let bitsPerComponent = 8
  static let bytesOfLength = 4
  
  static let dataPrefix = "<m12>"
  static let dataSuffix = "</m12>"
  
  static var sizeOfInfoLength: Int {
    return bytesOfLength * bitsPerComponent
  }
  
  static var minPixelsToMessage: Int {
    return (dataPrefix.count + dataSuffix.count) * bitsPerComponent
  }
  
  static var minPixels: Int {
    return sizeOfInfoLength + minPixelsToMessage
  }
  
}
