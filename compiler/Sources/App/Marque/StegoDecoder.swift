//
//  Decoder.swift
//  SwiftStego
//
//  Created by Brian Hans on 1/13/18.
//  Copyright © 2018 BrianHans. All rights reserved.
//

import Foundation

public class StegoDecoder {
    
    public static let `default` = StegoDecoder()
    
    public func search(in pixels: [UInt32], size: Int) throws -> String? {
        reset()
        
        var pixelPosition = 0
        
        while pixelPosition < DefaultsMarque.sizeOfInfoLength {
            self.getData(pixel: pixels[pixelPosition])
            pixelPosition += 1
        }
        
        guard self.length > 0 else { throw StegoError.invalidImage }
        
        reset()
        
        let pixelsToHide = Int(self.length) * DefaultsMarque.bitsPerComponent
        
        let salt = (size - Int(pixelPosition)) / pixelsToHide
        
        guard self.length > 0 else { throw StegoError.invalidImage }
        
        while pixelPosition <= size {
            getData(pixel: pixels[pixelPosition])
            pixelPosition += salt
            
            if (self.data?.suffix(DefaultsMarque.dataSuffix.count) ?? "") == DefaultsMarque.dataSuffix {
                break
            }
        }
        
        return self.data
    }
    
    private func getData(pixel: UInt32) {
        getData(color: Utilities.Color(pixel, shift: Utilities.ColorToStep(step: self.step).rawValue))
    }
    
    private func getData(color: UInt32) {
        if self.currentShift == 0 {
            let bit: UInt32 = color & 1
            self.bitsCharacter = (bit << self.currentShift) | UInt32(self.bitsCharacter)
            
            if self.step < DefaultsMarque.sizeOfInfoLength {
                getLength()
            } else {
                getCharacter()
            }
            
            self.currentShift = DefaultsMarque.initalShift
        } else {
            let bit: UInt32 = color & 1
            self.bitsCharacter = (bit << self.currentShift) | UInt32(self.bitsCharacter)
            self.currentShift -= 1
        }
        
        self.step += 1
    }
    
    private func getLength() {
        self.length = Utilities.AddBits(number1: self.length, number2: UInt32(self.bitsCharacter), shift: Int(self.step) % (DefaultsMarque.bitsPerComponent - 1))
        
        self.bitsCharacter = 0
    }
    
    private func getCharacter() {
        let character = String(format: "%c", arguments: [self.bitsCharacter])
        
        self.bitsCharacter = 0
        
        if let data = self.data {
            self.data = "\(data)\(character)"
        } else {
            self.data = character
        }
    }
    
    private func hasData() -> Bool {
        return (self.data?.count ?? 0) > 0
            && String(self.data?.prefix(DefaultsMarque.dataPrefix.count) ?? "") == DefaultsMarque.dataPrefix
            && String(self.data?.suffix(DefaultsMarque.dataSuffix.count) ?? "") == DefaultsMarque.dataSuffix
    }
    
    private func reset() {
        self.currentShift = DefaultsMarque.initalShift
        self.bitsCharacter = 0
    }
    
    
    // MARK: Private variables
    
    private var currentShift: Int = 0
    private var bitsCharacter: UInt32 = 0
    private var data: String?
    private var step: UInt32 = 0
    private var length: UInt32 = 0
}
