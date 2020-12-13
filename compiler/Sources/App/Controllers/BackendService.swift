//
//  Router.Backend.swift
//  Stoic
//
//  Created by Ritesh Pakala on 9/12/20.
//  Copyright © 2020 Ritesh Pakala. All rights reserved.
//
import Foundation
import Core
import Storage
import Datastore
import Vapor
import DirectoryService

public struct ModelPayload {
    let symbol: String
    let id: String
    let model: Data
    let dataSet: Data
    let metadata: Data
    
    var toString: String {
        return """
        \(symbol)
        \(id)
        \(model)
        \(dataSet)
        """
    }
}

public struct BackendService {
    var gcs: GoogleCloudStorageClient? = nil
    var models: [ModelPayload] = []
}
extension Application {
    public var backend: GoogleCloudStorageClient? {
        let directory = DirectoryConfiguration.detect()
        let configDir = ""

        do {
            if let url = URL(string: "file://"+directory.publicDirectory) {
                let firebaseAuth = url
                    .appendingPathComponent("stoic-45d04-firebase-adminsdk-dhagb-ced31eff78.json", isDirectory: false)
                
                
                
                
                let credentialsConfig = try GoogleCloudCredentialsConfiguration(projectId: "stoic-45d04", credentialsFile: firebaseAuth.path)
                
                let cloudStorageConfiguration = GoogleCloudStorageConfiguration(scope: [ .fullControl],
                                                                                serviceAccount: "default",
                                                                                project: "stoic-45d04-models-us")
                
                
                
                let client = HTTPClient.init(eventLoopGroupProvider: .shared(self.eventLoopGroup))
                let gcs = try GoogleCloudStorageClient(credentials: credentialsConfig,
                                                       storageConfig: cloudStorageConfiguration,
                                                       httpClient: client,
                                                       eventLoop: self.client.eventLoop)
                
                
                return gcs
                
            }
        } catch let error {
            print(error)
        }
        
        return nil
    }
}


