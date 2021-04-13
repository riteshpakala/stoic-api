//
//  VaderSentiment.swift
//  Stoic
//
//  Created by Ritesh Pakala on 7/26/20.
//  Copyright © 2020 Ritesh Pakala. All rights reserved.
//

import Foundation
import Vapor

public class VaderSentimentOutput: NSObject, Codable, NSCoding, NSSecureCoding {
    public static var supportsSecureCoding: Bool = true
    
    let pos: Double
    let neg: Double
    let neu: Double
    let compound: Double
    
    public init(pos: Double, neg: Double, neu: Double, compound: Double) {
        self.pos = pos
        self.neg = neg
        self.neu = neu
        self.compound = compound
    }
    
    var asString: String {
        return "{STOIC-SENTIMENT} pos: \(pos) neg: \(neg) neu: \(neu) compound: \(compound)"
    }
    
    public required convenience init?(coder: NSCoder) {
        let pos = coder.decodeDouble(forKey: "pos")
        let neg = coder.decodeDouble(forKey: "neg")
        let neu = coder.decodeDouble(forKey: "neu")
        let compound = coder.decodeDouble(forKey: "compound")

        self.init(
            pos: pos,
            neg: neg,
            neu: neu,
            compound: compound)
    }

    public func encode(with coder: NSCoder){
        coder.encode(pos, forKey: "pos")
        coder.encode(neg, forKey: "neg")
        coder.encode(neu, forKey: "neu")
        coder.encode(compound, forKey: "compound")
    }
}

class VaderSentiment {
    //(empirically derived mean sentiment intensity rating increase for booster words)
    static var B_INCR = 0.293
    static var B_DECR = -0.293

    //(empirically derived mean sentiment intensity rating increase for using ALLCAPs to emphasize a word)
    static var C_INCR = 0.733
    static var N_SCALAR = -0.74
    
    static var NEGATE: [String] =
        ["aint", "arent", "cannot", "cant", "couldnt", "darent", "didnt", "doesnt",
     "ain't", "aren't", "can't", "couldn't", "daren't", "didn't", "doesn't",
     "dont", "hadnt", "hasnt", "havent", "isnt", "mightnt", "mustnt", "neither",
     "don't", "hadn't", "hasn't", "haven't", "isn't", "mightn't", "mustn't",
     "neednt", "needn't", "never", "none", "nope", "nor", "not", "nothing", "nowhere",
     "oughtnt", "shant", "shouldnt", "uhuh", "wasnt", "werent",
     "oughtn't", "shan't", "shouldn't", "uh-uh", "wasn't", "weren't",
     "without", "wont", "wouldnt", "won't", "wouldn't", "rarely", "seldom", "despite"]
    
    //booster/dampener 'intensifiers' or 'degree adverbs'
    //http://en.wiktionary.org/wiki/Category:English_degree_adverbs
    static var BOOSTER_DICT: [String: Double] = {
        return ["absolutely": B_INCR, "amazingly": B_INCR, "awfully": B_INCR,
         "completely": B_INCR, "considerable": B_INCR, "considerably": B_INCR,
         "decidedly": B_INCR, "deeply": B_INCR, "effing": B_INCR, "enormous": B_INCR, "enormously": B_INCR,
         "entirely": B_INCR, "especially": B_INCR, "exceptional": B_INCR, "exceptionally": B_INCR,
         "extreme": B_INCR, "extremely": B_INCR,
         "fabulously": B_INCR, "flipping": B_INCR, "flippin": B_INCR, "frackin": B_INCR, "fracking": B_INCR,
         "fricking": B_INCR, "frickin": B_INCR, "frigging": B_INCR, "friggin": B_INCR, "fully": B_INCR,
         "fuckin": B_INCR, "fucking": B_INCR, "fuggin": B_INCR, "fugging": B_INCR,
         "greatly": B_INCR, "hella": B_INCR, "highly": B_INCR, "hugely": B_INCR,
         "incredible": B_INCR, "incredibly": B_INCR, "intensely": B_INCR,
         "major": B_INCR, "majorly": B_INCR, "more": B_INCR, "most": B_INCR, "particularly": B_INCR,
         "purely": B_INCR, "quite": B_INCR, "really": B_INCR, "remarkably": B_INCR,
         "so": B_INCR, "substantially": B_INCR,
         "thoroughly": B_INCR, "total": B_INCR, "totally": B_INCR, "tremendous": B_INCR, "tremendously": B_INCR,
         "uber": B_INCR, "unbelievably": B_INCR, "unusually": B_INCR, "utter": B_INCR, "utterly": B_INCR,
         "very": B_INCR,
         "almost": B_DECR, "barely": B_DECR, "hardly": B_DECR, "just enough": B_DECR,
         "kind of": B_DECR, "kinda": B_DECR, "kindof": B_DECR, "kind-of": B_DECR,
         "less": B_DECR, "little": B_DECR, "marginal": B_DECR, "marginally": B_DECR,
         "occasional": B_DECR, "occasionally": B_DECR, "partly": B_DECR,
         "scarce": B_DECR, "scarcely": B_DECR, "slight": B_DECR, "slightly": B_DECR, "somewhat": B_DECR,
         "sort of": B_DECR, "sorta": B_DECR, "sortof": B_DECR, "sort-of": B_DECR]
    }()
    
    // check for sentiment laden idioms that do not contain lexicon words (future work, not yet implemented)
    static var SENTIMENT_LADEN_IDIOMS: [String: Double] = ["cut the mustard": 2, "hand to mouth": -2,
                              "back handed": -2, "blow smoke": -2, "blowing smoke": -2,
                              "upper hand": 1, "break a leg": 2,
                              "cooking with gas": 2, "in the black": 2, "in the red": -2,
                              "on the ball": 2, "under the weather": -2]

    // check for special case idioms and phrases containing lexicon words
    static var SPECIAL_CASES: [String: Double] = ["the shit": 3, "the bomb": 3, "bad ass": 1.5, "badass": 1.5, "bus stop": 0.0,
                     "yeah right": -2, "kiss of death": -1.5, "to die for": 3,
                     "beating heart": 3.1, "broken heart": -2.9, "all time high": 3, "price hike": -1, "rate hike": -2,
                     "high debt": -2, "high fiscal deficit": -3, "AH": 3]
    
    
    //MARK: Static methods

    static func negated(
        _ input_words: [String],
        include_nt: Bool = true) -> Bool {
//        """
//        Determine if input contains negation words
//        """
        let words = input_words.map { $0.lowercased() }
        var neg_words: [String] = []
        neg_words.append(contentsOf: NEGATE)
        for word in neg_words {
            if words.contains(word) {
                return true
            }
        }
        if include_nt{
            for word in input_words {
                if word.contains("n't") {
                    return true
                }
            }
        }
//        '''if "least" in input_words:
//            i = input_words.index("least")
//            if i > 0 and input_words[i - 1] != "at":
//                return True'''
        return false
    }
    
    static func normalize(
        _ score: Double,
        _ alpha: Double = 15) -> Double{
//        """
//        Normalize the score to be between -1 and 1 using an alpha that
//        approximates the max expected value
//        """
        let norm_score: Double = score / sqrt((score * score) + alpha)
        if norm_score < -1.0 {
            return -1.0
        }else if norm_score > 1.0 {
            return 1.0
        }else{
            return norm_score
        }
    }

    static func allcap_differential(
        words: [String]) -> Bool {
//    """
//    Check whether just some words in the input are ALL CAPS
//    :param list words: The words to inspect
//    :returns: `True` if some but not all items in `words` are ALL CAPS
//    """
        var is_different = false
        var allcap_words = 0
        for word in words {
            if word.isUpper {
                allcap_words += 1
            }
        }
        let cap_differential = words.count - allcap_words
        if 0 < cap_differential, cap_differential < words.count {
            is_different = true
        }
        return is_different
    }
    
    static func scalar_inc_dec(
        _ word: String,
        _ valence: Double,
        _ is_cap_diff: Bool) -> Double {
//        """
//        Check if the preceding words increase, decrease, or negate/nullify the
//        valence
//        """
        var scalar = 0.0
        let word_lower = word.lowercased()
        if BOOSTER_DICT.keys.contains(word_lower){
            scalar = BOOSTER_DICT[word_lower] ?? scalar
            if valence < 0 {
                scalar *= -1
            }
            // check if booster/dampener word is in ALLCAPS (while others aren't)
            if word.isUpper && is_cap_diff {
                if valence > 0{
                    scalar += C_INCR
                }else{
                    scalar -= C_INCR
                }
            }
        }
        return scalar
    }
    
    static func predict(
        _ text: String,
        analyzer: VaderSentimentAnalyzer = .init()) -> VaderSentimentOutput {
        return analyzer.polarityScores(text)
    }
    
    static func test() {
        let sentences = ["VADER is smart, handsome, and funny.",  // positive sentence example
                     "VADER is smart, handsome, and funny!",
                     // punctuation emphasis handled correctly (sentiment intensity adjusted)
                     "VADER is very smart, handsome, and funny.",
                     // booster words handled correctly (sentiment intensity adjusted)
                     "VADER is VERY SMART, handsome, and FUNNY.",  // emphasis for ALLCAPS handled
                     "VADER is VERY SMART, handsome, and FUNNY!!!",
                     // combination of signals - VADER appropriately adjusts intensity
                     "VADER is VERY SMART, uber handsome, and FRIGGIN FUNNY!!!",
                     // booster words & punctuation make this close to ceiling for score
                     "VADER is not smart, handsome, nor funny.",  // negation sentence example
                     "The book was good.",  // positive sentence
                     "At least it isn't a horrible book.",  // negated negative sentence with contraction
                     "The book was only kind of good.",
                     // qualified positive sentence is handled correctly (intensity adjusted)
                     "The plot was good, but the characters are uncompelling and the dialog is not great.",
                     // mixed negation sentence
                     "Today SUX!",  // negative slang with capitalization emphasis
                     "Today only kinda sux! But I'll get by, lol",
                     // mixed sentiment example with slang and constrastive conjunction "but"
                     "Make sure you :) or :D today!",  // emoticons handled
                     "Catch utf-8 emoji such as 💘 and 💋 and 😁",  // emojis handled
                     "Not bad at all"  // Capitalized negation
                     ]

        let analyzer = VaderSentimentAnalyzer()

        print("----------------------------------------------------")
        print(" - Analyze typical example cases, including handling of:")
        print("  -- negations")
        print("  -- punctuation emphasis & punctuation flooding")
        print("  -- word-shape as emphasis (capitalization difference)")
        print("  -- degree modifiers (intensifiers such as 'very' and dampeners such as 'kind of')")
        print("  -- slang words as modifiers such as 'uber' or 'friggin' or 'kinda'")
        print("  -- contrastive conjunction 'but' indicating a shift in sentiment; sentiment of later text is dominant")
        print("  -- use of contractions as negations")
        print("  -- sentiment laden emoticons such as :) and :D")
        print("  -- utf-8 encoded emojis such as 💘 and 💋 and 😁")
        print("  -- sentiment laden slang words (e.g., 'sux')")
        print("  -- sentiment laden initialisms and acronyms (for example: 'lol') \n")
        for sentence in sentences{
            let vs = analyzer.polarityScores(sentence)
            print("-- [\(sentence)] -- \(vs.asString)")
        }
    }
}

//MARK: SentiText
struct VaderSentiText {
    let text: String
    var is_cap_diff: Bool = false
    init(
        _ text: String) {
        self.text = text
        is_cap_diff = VaderSentiment.allcap_differential(
            words: wordsAndEmoticons)
    }
    
    var wordsAndEmoticons: [String] {
        let wes: [String] = text.trimmingCharacters(
            in: .whitespacesAndNewlines)
            .components(
                separatedBy: .whitespaces)
        
        let results: [String] = wes.map {
            
            let token = $0.trimmingCharacters(
                in: .punctuationCharacters)

            if token.count <= 2 {
                return $0
            } else {
                return token
            }
        }
        
        return results
    }
}

//MARK: SentiAnalyzer
class VaderSentimentAnalyzer {
    var lexicon: [String: Double] = [:]
    var emojis: [String: String] = [:]
    
    init(
        lexicon_file: String = "vader_lexicon.txt",
        emoji_lexicon: String = "emoji_utf8_lexicon.txt",
        fileType: String = "txt") {
        
        let directory = DirectoryConfiguration.detect()
        let configDir = ""
        
        guard let url = URL(string: "file://"+directory.publicDirectory) else {
            return
        }
        let vaderLexiconURL = url
                .appendingPathComponent(lexicon_file, isDirectory: false)
        let emojiLexiconURL = url
                .appendingPathComponent(emoji_lexicon, isDirectory: false)
        
        let contentVaderLexicon: String = (try? String.init(
            contentsOf: vaderLexiconURL,
            encoding: .utf8)) ?? ""
        
        let contentEmojiLexicon: String = (try? String.init(
            contentsOf: emojiLexiconURL,
            encoding: .utf8)) ?? ""
        
        lexicon = makeLexiconDict(
            content: contentVaderLexicon)
        emojis = makeEmojiDict(
            content: contentEmojiLexicon)
    }
    
    func makeLexiconDict(content: String) -> [String: Double] {
        var dict: [String: Double] = [:]
        for line in content.trailingSpacesTrimmed.components(
            separatedBy: .newlines) {
            
                let trimmed = line.trimmingCharacters(
                    in: .whitespacesAndNewlines)
                
                let values = trimmed.components(separatedBy: "\t")
                if values.count > 1, let measure = Double(values[1]) {
                    dict[values[0]] = measure
                }
        }
        return dict
    }
    
    func makeEmojiDict(content: String) -> [String: String] {
        var dict: [String: String] = [:]
        for line in content.trailingSpacesTrimmed.components(
            separatedBy: .newlines) {
            
                let trimmed = line.trimmingCharacters(
                    in: .whitespacesAndNewlines)
                
                let values = trimmed.components(separatedBy: "\t")
                if values.count > 1 {
                    dict[values[0]] = values[1]
                }
        }
        return dict
    }
    
    func polarityScores(_ text: String) -> VaderSentimentOutput {
//        """
//        Return a float for sentiment strength based on the input text.
//        Positive values are positive valence, negative value are negative
//        valence.
//        """
        // convert emojis to their textual descriptions
        var text_no_emoji = ""
        var prev_space = true
        for chr in text {
            if self.emojis.keys.contains(String(chr)) {
                // get the textual description
                let description = self.emojis[String(chr)]
                if !prev_space {
                    text_no_emoji += " "
                }
                text_no_emoji += description ?? ""
                prev_space = false
            } else {
                text_no_emoji += String(chr)
                prev_space = chr == " "
            }
        }
        let newText = text_no_emoji.strip

        let sentitext = VaderSentiText(newText)

        var sentiments: [Double] = []
        let words_and_emoticons: [String] = sentitext.wordsAndEmoticons
    
        for (i, item) in words_and_emoticons.enumerated(){
            let valence: Double = 0
            // check for vader_lexicon words that may be used as modifiers or negations
            if VaderSentiment.BOOSTER_DICT.keys.contains(
                item.lowercased()) {
                sentiments.append(valence)
                continue
            }
            if (i < words_and_emoticons.count - 1 &&
                item.lowercased() == "kind" &&
                words_and_emoticons[i + 1].lowercased() == "of") {
                
                sentiments.append(valence)
                continue
            }
            sentiments = self.sentiment_valence(valence, sentitext, item, i, sentiments)
        }

        sentiments = self._but_check(words_and_emoticons, sentiments)

        let valence_dict = self.score_valence(sentiments, text)

        return valence_dict
    }
    
    func sentiment_valence(
        _ valenceStart: Double,
        _ sentitext: VaderSentiText,
        _ item: String,
        _ i: Int,
        _ sentimentsStart: [Double]) -> [Double] {
        
        var valence = valenceStart
        let is_cap_diff = sentitext.is_cap_diff
        let words_and_emoticons = sentitext.wordsAndEmoticons
        let item_lowercase = item.lowercased()
        var sentiments: [Double] = sentimentsStart
        if self.lexicon.keys.contains(item_lowercase){
            // get the sentiment valence
            valence = self.lexicon[item_lowercase] ?? 0.0
                
            // check for "no" as negation for an adjacent lexicon item vs "no" as its own stand-alone lexicon item
            if item_lowercase == "no" &&
                i != words_and_emoticons.count-1 &&
                self.lexicon.keys.contains(words_and_emoticons[i + 1].lowercased()) {
                // don't use valence of "no" as a lexicon item. Instead set it's valence to 0.0 and negate the next item
                valence = 0.0
            }
            if (i > 0 && words_and_emoticons[i - 1].lowercased() == "no")
                || (i > 1 && words_and_emoticons[i - 2].lowercased() == "no")
                || (i > 2 && words_and_emoticons[i - 3].lowercased() == "no" &&
                    ["or", "nor"].contains(words_and_emoticons[i - 1].lowercased()) ){
                valence = (self.lexicon[item_lowercase] ?? 0.0) * VaderSentiment.N_SCALAR
            }
            
            // check if sentiment laden word is in ALL CAPS (while others aren't)
            if item.isUpper && is_cap_diff {
                if valence > 0 {
                    valence += VaderSentiment.C_INCR
                } else {
                    valence -= VaderSentiment.C_INCR
                }
            }

            for start_i in 0..<3{
                // dampen the scalar modifier of preceding words and emoticons
                // (excluding the ones that immediately preceed the item) based
                // on their distance from the current item.
                if i > start_i &&
                    !self.lexicon.keys.contains(words_and_emoticons[i - (start_i + 1)].lowercased()){
                    var s = VaderSentiment.scalar_inc_dec(words_and_emoticons[i - (start_i + 1)], valence, is_cap_diff)
                    if start_i == 1 && s != 0 {
                        s = s * 0.95
                    }
                    if start_i == 2 && s != 0 {
                        s = s * 0.9
                    }
                    valence = valence + s
                    valence = self._negation_check(valence, words_and_emoticons, start_i, i)
                    if start_i == 2 {
                        valence = self._special_idioms_check(valence, words_and_emoticons, i)
                    }
                }
            }

            valence = self._least_check(valence, words_and_emoticons, i)
        }
        sentiments.append(valence)
        return sentiments
    }
    
    func _least_check(
        _ valenceStart: Double,
        _ words_and_emoticons: [String],
        _ i: Int) -> Double {
        var valence: Double = valenceStart
        // check for negation case using "least"
        if i > 1 &&
            !self.lexicon.keys.contains(words_and_emoticons[i - 1].lowercased()) &&
            words_and_emoticons[i - 1].lowercased() == "least" {
            if words_and_emoticons[i - 2].lowercased() != "at" &&
                words_and_emoticons[i - 2].lowercased() != "very"{
                valence = valence * VaderSentiment.N_SCALAR
            }
        }else if i > 0 &&
            !self.lexicon.keys.contains(words_and_emoticons[i - 1].lowercased()) &&
            words_and_emoticons[i - 1].lowercased() == "least" {
            valence = valence * VaderSentiment.N_SCALAR
        }
        return valence
    }
    
    func _but_check(
        _ words_and_emoticons: [String],
        _ sentimentsStart: [Double]) -> [Double] {
        // check for modification in sentiment due to contrastive conjunction 'but'
        let words_and_emoticons_lower = words_and_emoticons.map { return $0.lowercased() }
        var sentiments: [Double] = sentimentsStart
        if words_and_emoticons_lower.contains("but") {
            let bi = words_and_emoticons_lower.firstIndex(of: "but") ?? 0
            for (si, sentiment) in sentiments.enumerated() {
                if si < bi {
                    sentiments.remove(at: si)
                    sentiments.insert(sentiment * 0.5, at: si)
                } else if si > bi {
                    sentiments.remove(at: si)
                    sentiments.insert(sentiment * 1.5, at: si)
                }
            }
        }
        return sentiments
    }
    
    func _special_idioms_check(
        _ valenceStart: Double,
        _ words_and_emoticons: [String],
        _ i: Int) -> Double {
        
        var valence: Double = valenceStart
        let words_and_emoticons_lower: [String] = words_and_emoticons.map { $0.lowercased() }
        let onezero = words_and_emoticons_lower[i - 1]+" "+words_and_emoticons_lower[i]

        let twoonezero = words_and_emoticons_lower[i - 2]+" "+words_and_emoticons_lower[i - 1]+" "+words_and_emoticons_lower[i]

        let twoone = words_and_emoticons_lower[i - 2]+" "+words_and_emoticons_lower[i - 1]

        let threetwoone = words_and_emoticons_lower[i - 3]+" "+words_and_emoticons_lower[i - 2]+" "+words_and_emoticons_lower[i - 1]

        let threetwo = words_and_emoticons_lower[i - 3]+" "+words_and_emoticons_lower[i - 2]

        let sequences = [onezero, twoonezero, twoone, threetwoone, threetwo]
       
        for seq in sequences {
            if VaderSentiment.SPECIAL_CASES.keys.contains(seq) {
                valence = VaderSentiment.SPECIAL_CASES[seq] ?? valence
                break
            }
        }

        if words_and_emoticons_lower.count - 1 > i {
            let zeroone = words_and_emoticons_lower[i]+" "+words_and_emoticons_lower[i + 1]

            if VaderSentiment.SPECIAL_CASES.keys.contains(zeroone){
                valence = VaderSentiment.SPECIAL_CASES[zeroone] ?? valence
            }
        }
        if words_and_emoticons_lower.count - 1 > i + 1 {
            let zeroonetwo = words_and_emoticons_lower[i]+" "+words_and_emoticons_lower[i + 1]+" "+words_and_emoticons_lower[i + 2]

            if VaderSentiment.SPECIAL_CASES.keys.contains(zeroonetwo) {

                valence = VaderSentiment.SPECIAL_CASES[zeroonetwo] ?? valence
            }
        }

        // check for booster/dampener bi-grams such as 'sort of' or 'kind of'
        let n_grams = [threetwoone, threetwo, twoone]
        
        for n_gram in n_grams {
            if VaderSentiment.BOOSTER_DICT.keys.contains(n_gram){
                valence = valence + (VaderSentiment.BOOSTER_DICT[n_gram] ?? 0.0)
            }
        }
        return valence
    }
    
    //TODO:
    //senti_text_lower may not be string array, but
    //look at the context of comments and deduce later
    //
    func _sentiment_laden_idioms_check(
        valenceStart: Double,
        senti_text_lower: [String]) -> Double {
        // Future Work
        // check for sentiment laden idioms that don't contain a lexicon word
        var idioms_valences: [Double] = []
        var valence: Double = valenceStart
        for idiom in VaderSentiment.SENTIMENT_LADEN_IDIOMS{
            if senti_text_lower.contains(idiom.key) {
//                print(idiom, senti_text_lower)
                valence = VaderSentiment.SENTIMENT_LADEN_IDIOMS[idiom.key] ?? 0.0
                idioms_valences.append(valence)
            }
        }
        if idioms_valences.count > 0 {
            valence = (idioms_valences.reduce(0, +)) / Double(idioms_valences.count)
        }
        return valence
    }
    
    func _negation_check(
        _ valenceStart: Double,
        _ words_and_emoticons: [String],
        _ start_i: Int,
        _ i: Int) -> Double {
        
        let words_and_emoticons_lower: [String] = words_and_emoticons.map { $0.lowercased() }
        var valence: Double = valenceStart
        if start_i == 0{
            if VaderSentiment.negated([words_and_emoticons_lower[i - (start_i + 1)]]){//  # 1 word preceding lexicon word (w/o stopwords)
                valence = valence * VaderSentiment.N_SCALAR
            }
        }
        if start_i == 1{
            if words_and_emoticons_lower[i - 2] == "never" &&
                    (words_and_emoticons_lower[i - 1] == "so" ||
                    words_and_emoticons_lower[i - 1] == "this") {
                valence = valence * 1.25
            }else if words_and_emoticons_lower[i - 2] == "without" &&
                    words_and_emoticons_lower[i - 1] == "doubt" {
                //valence = valence
            }else if VaderSentiment.negated([words_and_emoticons_lower[i - (start_i + 1)]]){  //# 2 words preceding the lexicon word position
                valence = valence * VaderSentiment.N_SCALAR
            }
        }
        if start_i == 2{
            if words_and_emoticons_lower[i - 3] == "never" &&
                (words_and_emoticons_lower[i - 2] == "so" || words_and_emoticons_lower[i - 2] == "this") || (words_and_emoticons_lower[i - 1] == "so" || words_and_emoticons_lower[i - 1] == "this"){
                valence = valence * 1.25
            }else if words_and_emoticons_lower[i - 3] == "without" &&
                (words_and_emoticons_lower[i - 2] == "doubt" || words_and_emoticons_lower[i - 1] == "doubt"){
                //valence = valence
            }else if VaderSentiment.negated([words_and_emoticons_lower[i - (start_i + 1)]]){ // # 3 words preceding the lexicon word position
                valence = valence * VaderSentiment.N_SCALAR
            }
        }
        return valence
    }
    
    func _punctuation_emphasis(
        _ text: String) -> Double {
        // add emphasis from exclamation points and question marks
        let ep_amplifier = self._amplify_ep(text)
        let qm_amplifier = self._amplify_qm(text)
        
        let punct_emph_amplifier = ep_amplifier + qm_amplifier
        return punct_emph_amplifier
    }
    
    func _amplify_ep(
        _ text: String) -> Double {
        // check for added emphasis resulting from exclamation points (up to 4 of them)
        var ep_count: Double = Double(text.filter { $0 == "!" }.count)
        var ep_amplifier: Double = 0
        if ep_count > 4 {
            ep_count = 4
        }
        // (empirically derived mean sentiment intensity rating increase for
        // exclamation points)
        ep_amplifier = ep_count * 0.292
        return ep_amplifier
    }
    
    func _amplify_qm(
        _ text: String) -> Double {
        // check for added emphasis resulting from question marks (2 or 3+)
        let qm_count: Double = Double(text.filter { $0 == "?" }.count)
        var qm_amplifier: Double = 0
        if qm_count > 1 {
            if qm_count <= 3 {
                // (empirically derived mean sentiment intensity rating increase for
                // question marks)
                qm_amplifier = qm_count * 0.18
            } else {
                qm_amplifier = 0.96
            }
        }
        return qm_amplifier
    }
    
    func _sift_sentiment_scores(
        _ sentiments: [Double]) -> (posSum: Double, neuCount: Double, negSum: Double){
    // want separate positive versus negative sentiment scores
        var pos_sum: Double = 0.0
        var neg_sum: Double = 0.0
        var neu_count: Double = 0.0
        
        for sentiment_score in sentiments{
            if sentiment_score > 0 {
                pos_sum += (sentiment_score + 1)  // compensates for neutral words that are counted as 1
            }
            if sentiment_score < 0 {
                neg_sum += (sentiment_score - 1)  // when used with math.fabs(), compensates for neutrals
            }
            if sentiment_score == 0 {
                neu_count += 1
            }
        }
        return (pos_sum, neu_count, neg_sum)
    }
    
    func score_valence(
        _ sentiments: [Double],
        _ text: String) -> VaderSentimentOutput {
        let compound: Double
        let pos: Double
        let neg: Double
        let neu: Double
        if !sentiments.isEmpty {
            var sum_s = sentiments.reduce(0, +)
            // compute and add emphasis from punctuation in text
            let punct_emph_amplifier = self._punctuation_emphasis(text)
            if sum_s > 0 {
                sum_s += punct_emph_amplifier
            }else if sum_s < 0 {
                sum_s -= punct_emph_amplifier
            }

            compound = VaderSentiment.normalize(sum_s)
            // discriminate between positive, negative and neutral sentiment scores
            var sentiScores = self._sift_sentiment_scores(sentiments)
            
            if sentiScores.posSum > abs(sentiScores.negSum) {
                sentiScores.posSum += punct_emph_amplifier
            }else if sentiScores.posSum < abs(sentiScores.negSum){
                sentiScores.negSum -= punct_emph_amplifier
            }
            let total = sentiScores.posSum + abs(sentiScores.negSum) + sentiScores.neuCount
            pos = abs(sentiScores.posSum / total)
            neg = abs(sentiScores.negSum / total)
            neu = abs(sentiScores.neuCount / total)

        }else{
            compound = 0.0
            pos = 0.0
            neg = 0.0
            neu = 0.0
        }
        
//        let sentiment_dict: [String: Double] =
//            ["neg": round(neg*1000)/1000,
//             "neu": round(neu*1000)/1000,
//             "pos": round(pos*1000)/1000,
//             "compound": round(compound*10000)/10000]

        return .init(
            pos: round(pos*1000)/1000,
            neg: round(neg*1000)/1000,
            neu: round(neu*1000)/1000,
            compound: round(compound*10000)/10000)
    }
}

extension String {
    var trailingSpacesTrimmed: String {
        var newString = self

        while newString.last?.isWhitespace == true || newString.last?.isNewline == true {
            newString = String(newString.dropLast())
        }

        return newString
    }
    
    var stripNewLines: String {
        return self.trimmingCharacters(in: .newlines)
    }
    
    var strip: String {
        return self.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    var isUpper: Bool {
        return self.filter { $0.isLowercase }.isEmpty
    }
    
    var isLower: Bool {
        return self.filter { $0.isUppercase }.isEmpty
    }
}
