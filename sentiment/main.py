import snscrape.modules.twitter as sntwitter
from flask import jsonify

def social(request):
    """Responds to any HTTP request.
    Args:
        request (flask.Request): HTTP request object.
    Returns:
        The response text or any set of values that can be turned into a
        Response object using
        `make_response <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>`.
    """
    query = ""
    since = ""
    until = ""
    count = ""


    request_json = request.get_json()
    if request.args and 'query' in request.args:
        query = request.args.get('query')
    elif request_json and 'query' in request_json:
        query = request_json['query']

    if request.args and 'since' in request.args:
        since = request.args.get('since')
    elif request_json and 'since' in request_json:
        since = request_json['since']

    if request.args and 'until' in request.args:
        until = request.args.get('until')
    elif request_json and 'until' in request_json:
        until = request_json['until']

    if request.args and 'count' in request.args:
        count = request.args.get('count')
    elif request_json and 'count' in request_json:
        count = request_json['count']

    tweets = []
    test = ''
    # for i,tweet in enumerate(sntwitter.TwitterSearchScraper(query + 'since:' + since + ' until:' + until).get_items()) :
    #     if i > int(count):
    #         break

    #     print(tweet.content.encode('utf-8'))
    #     quote = ''
    #     if tweet.quotedTweet != None:
    #         quote = tweet.quotedTweet.content.encode('utf-8')
    #     tweets.append({"content":tweet.content.encode('utf-8'), "date":tweet.date.timestamp(), "quote":quote})
    #     test = tweet.content.encode('utf-8')

    print(since)
    print(until)
    print(query)

    maxTweets = int(count)  # the number of tweets you require
    for i,tweet in enumerate(sntwitter.TwitterSearchScraper('#covid19' + 'since:2020-10-15 until:2020-10-16').get_items()) :
        if i > maxTweets :
            break

        tweets.append({"content":tweet.content.encode('utf-8'), "date":str(tweet.date.timestamp()).encode('utf-8')})
        test = tweet.content.encode('utf-8')

    return jsonify({"result": len(tweets), "test" : test, "yo":jsonify(tweets)})
