//
//  File.swift
//  
//
//  Created by Ritesh Pakala on 4/12/21.
//

import Foundation
//MARK: -- DataSet without no sentiment
class SecurityDataSet {
    let security: Security
    
    var indicators: Indicators
    
    let change: Double
    
    let context: Indicators.Context

    init(quote: [Security],
         context: Indicators.Context = .close) {
        
        var quoteLastRemoved = quote
        let lastSecurity = quoteLastRemoved.removeLast() //most recent
        
        let indicators = Indicators.init(with: quoteLastRemoved)
        self.indicators = indicators
        self.security = lastSecurity
        self.change = (lastSecurity.value - indicators.security.value) / indicators.security.value
        self.context = context
    }

    public lazy var asArray: [Double] = {
        [
            indicators.emaWA(context: context),
            indicators.smaWA(context: context),
            indicators.basePair.volatility.volatility,
            indicators.basePair.volatility.momentum,
            indicators.basePair.volatility.change,
            indicators.vwa(),
        ]
    }()
    
    public func asArrayIMBHS(_ daysForEMA: Int, _ daysForSMA: Int) -> ([Double]) {
        
        
        return ([
            indicators.emaWA(daysForEMA, context: context),
            indicators.smaWA(daysForSMA, context: context),
            indicators.basePair.volatility.volatility,
            indicators.basePair.volatility.momentum,
            indicators.basePair.volatility.change,
            indicators.vwa(),
        ])
    }

    public var inDim: Int {
        asArray.count
    }

    public var outDim: Int {
        output.count
    }

    public var output: [Double] {
        //[security.value(forContext: context)]
        [ change ]
    }
    
    public var asString: String {
        """
        [\(indicators.security.dateAsString)]
        \(asArray)
        """
    }
}
