const functions = require('firebase-functions');

var firebase = require('firebase-admin');
var firebaseServiceAccount = require("./certs/firebase/stoic-45d04-firebase-adminsdk-dhagb-0cc6883e09.json");
firebase.initializeApp({
  credential: firebase.credential.cert(firebaseServiceAccount),
  databaseURL: "https://stoic-45d04.firebaseio.com/"
});
let firebaseApp = firebase.app();

// const {Storage} = require('@google-cloud/storage');

//Database constants
const firebaseDB = firebaseApp.database();
const firebasePredictionsDB = firebaseApp.database('https://stoic-45d04-predictions-3acae.firebaseio.com/');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  // functions.logger.info("Hello logs!", {structuredData: true});
  // response.send("Hello from Firebase!");

  firebasePredictionsDB.ref().child("global").once('value').then(function(snapshot) {
      let data = snapshot.val();
      if (data) {

        let todaysDate = new Date();
        let tDate_Epoch = (Math.floor((todaysDate.getTime()-todaysDate.getMilliseconds())/1000)).toString();
        let tDate_Epoch_30MinAgo = tDate_Epoch - ((30) * 60 * 1000);

        let keys = Object.keys(data);
        let stocks = [];
        snapshot.forEach(function(childSnapshot) {
            let child = childSnapshot.val();

            let keysOfTickers = Object.keys(child);

            keysOfTickers.forEach((ticker, i) => {
                let prediction = child[ticker];
                let timestamps = Object.keys(prediction);
                timestamps = timestamps.filter(timestamp => parseInt(timestamp) >= tDate_Epoch_30MinAgo);
                timestamps.sort(function(a, b){return parseInt(b)-parseInt(a)});

                timestamps.forEach((timestamp, i) => {

                  let id = prediction[timestamp]["id"];
                  let type = prediction[timestamp]["type"];

                  //

                  let payloadPredictionPayload = [];

                  payloadPredictionPayload.push({
                    key: id,
                    value: prediction[timestamp],
                  });

                  //


                  let timestampPayload = [];

                  timestampPayload.push({
                    key: timestamp,
                    value: payloadPredictionPayload,
                  });

                  //

                  let typePayload = [];

                  typePayload.push({
                    key: type,
                    value: timestampPayload,
                  });

                  //

                  if (!stocks[ticker]) {
                      stocks.push({
                        key: ticker,
                        value: typePayload,
                      });
                  } else if (!stocks[ticker][type]) {
                      stocks[ticker].push(typePayload);
                  } else if (!stocks[ticker][type][timestamp]) {
                      stocks[ticker][type].push(timestampPayload);
                  }

                  response.send(stocks);
                });
            });

            // for (var ticker in keysOfTickers) {
            //   // let timestamps = Object.keys(child[ticker]);
            //
            //   // timestamps = timestamps.filter(timestamps => timestamps >= tDate_Epoch_30MinAgo);
            //
            // }


        });
        // for (var key in keys) {
        //   console.log(key);
        //
        //   let userPredictions = data[key];
        //
        //   response.send(data);
        //   let tickers = Object.keys(userPredictions);
        //
        //   for (var ticker in tickers) {
        //     let resultsViaDate = userPredictions[ticker];
        //     let dates = Object.keys(resultsViaDate);
        //     const recentDates = dates.filter(dates => dates >= tDate_Epoch_30MinAgo);
        //
        //     response.send(recentDates);
        //     //Get only predictions within target interval
        //
        //
        //
        //     // //Ticker exists, if date exists and this predictions
        //     // //is better, replace
        //     // if (stocks.keys.contains(ticker)) {
        //     //   let dates = Object.Keys(stocks[ticker]);
        //     //
        //     //   //Date exists, let's compare predictions, choose the best one
        //     //   if (dates.keys.contains(date)) {
        //     //
        //     //   } else { //date does not exist, let's add it in
        //     //
        //     //   }
        //     //
        //     // } else { // Ticker does not exist let's add this in
        //     //   stocks[ticker] = userPredictions[ticker];
        //     // }
        //   }
        // }
      } else {
        response.redirect('/');
        //
      }
  }, function(error) {
    console.log(error);
  });
});
