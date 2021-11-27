//
//  File.swift
//  
//
//  Created by Ritesh Pakala on 11/26/21.
//

import Foundation
import Fluent
import Vapor
import Core
import Storage
import Datastore
import MarqueKitObjC
import AppKit

struct MarqueController: RouteCollection {
    let loopGroup: EventLoopGroup
    
    init(loopGroup: EventLoopGroup) {
        self.loopGroup = loopGroup
//        service.gcs = backend
    }
    
    func boot(routes: RoutesBuilder) throws {
        let todos = routes.grouped("marque")
//        todos.get(use: index)
        
        todos.group("engrave") { todo in
            todo.on(.POST, body: .collect(maxSize: 500000), use: engrave)
        }
    }
    
    func engrave(req: Request) throws -> EventLoopFuture<EngravingResult> {
        let promise = loopGroup.next().makePromise(of: EngravingResult.self)
        let contentType = req.headers["Content-Type"]
        do {
            
            let status = try req.content.decode(Engraving.self)
            
            if let image = NSImage.init(data: status.photo) {
                
                ISSteganographer.hideData(status.address, withImage: image) { (image, error) in
                    
                    if let imageCheck = image {
                        print("image created")
                        
                        ISSteganographer.data(fromImage: imageCheck) { (data, error) in
                            if let data = data {
                                if let encryptedMessage = NSString.init(data: data, encoding: String.Encoding.utf8.rawValue) {
                                   print(encryptedMessage)
                                    promise.completeWith(.init(catching: {
                                        EngravingResult.init(output: "success")
                                    }))
                                }
                            } else {
                                print("failed to decode")
                                print(error?.localizedDescription)
                                promise.completeWith(.init(catching: {
                                    EngravingResult.init(output: "fail")
                                }))
                            }
                        }
                    } else {
                        print(error?.localizedDescription)
                        promise.completeWith(.init(catching: {
                            EngravingResult.init(output: "fail")
                        }))
                    }
                }
            }
        } catch let error {
            print(error.localizedDescription)
            promise.completeWith(.init(catching: {
                EngravingResult.init(output: "fail")
            }))
        }
        
        return promise.futureResult
    }
}
