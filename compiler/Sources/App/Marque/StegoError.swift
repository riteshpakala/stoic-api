//
//  StegoError.swift
//  SwiftStego
//
//  Created by Brian Hans on 1/14/18.
//  Copyright © 2018 BrianHans. All rights reserved.
//

import Foundation

enum StegoError: Error {
  case unknown
  case imageToSmall
  case invalidImage
  case invalidProvider
  case invalidCFProvider
  case coreGraphicsFailed
  case unableToEncodeData
}
