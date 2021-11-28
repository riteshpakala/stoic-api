//
//  Encoder.swift
//  SwiftStego
//
//  Created by Brian Hans on 1/13/18.
//  Copyright © 2018 BrianHans. All rights reserved.
//
import Foundation

public class StegoEncoder {
    
    public static let `default`: StegoEncoder = StegoEncoder()
    
    // MARK: Private functions
    
    public func hide(string: String, in pixelsToMutate: [UInt32], size: Int) throws  -> [UInt32]{
        var pixels = pixelsToMutate
        guard let message = messageToHide(string: string) else { throw StegoError.unableToEncodeData }
        var length = message.count
        
        if (length * DefaultsMarque.bitsPerComponent) < (size - DefaultsMarque.sizeOfInfoLength) {
            reset()
            
            let data = NSData(bytes: &length, length: DefaultsMarque.bytesOfLength)
            
            let lengthDataInfo = String.init(data: data as Data, encoding: .ascii) ?? ""
            
            var pixelPosition: Int = 0
            
            self.dataToHide = lengthDataInfo
            
            while pixelPosition < DefaultsMarque.sizeOfInfoLength {
                pixels[pixelPosition] = self.newPixel(pixel: pixels[pixelPosition])
                pixelPosition += 1
            }
            
            reset()
            
            let pixelsToHide = message.count * DefaultsMarque.bitsPerComponent
            
            self.dataToHide = message
            
            let ratio = (size - pixelPosition) / pixelsToHide
            
            let salt = ratio
            
            while pixelPosition <= size {
                pixels[pixelPosition] = self.newPixel(pixel: pixels[pixelPosition])
                pixelPosition += salt
            }
        }
        
        return pixels
    }
    
    private func newPixel(pixel: UInt32) -> UInt32 {
        let color = self.newColor(color: pixel)
        self.step += 1
        return color
    }
    
    private func newColor(color: UInt32) -> UInt32 {
        if self.dataToHide.count > self.currentCharacter {
            let asciiCode = UInt32((self.dataToHide as NSString).character(at: self.currentCharacter))
            let shiftedBits = asciiCode >> self.currentShift
            
            if currentShift == 0 {
                currentShift = DefaultsMarque.initalShift
                currentCharacter += 1
            } else {
                currentShift -= 1
            }
            
            return Utilities.NewPixel(pixel: color, shiftedBits: shiftedBits, shift: Utilities.ColorToStep(step: self.step).rawValue)
        }
        
        return color
    }
    
    private func reset() {
        self.currentShift = DefaultsMarque.initalShift
        self.currentCharacter = 0
    }
    
    private func messageToHide(string: String) -> String? {
        let data = string.data(using: .utf8)
        guard let base64String = data?.base64EncodedString() else { return nil }
        
        return DefaultsMarque.dataPrefix + base64String + DefaultsMarque.dataSuffix
    }
    
    // MARK: Private variables
    
    private var currentShift: Int = DefaultsMarque.initalShift
    private var currentCharacter: Int = 0
    private var step: UInt32 = 0
    private var dataToHide: String = ""
}
