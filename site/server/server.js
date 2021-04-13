var fs = require('fs');
var path = require('path');
var express = require('express');
var cors = require('cors');

var forceSsl = function (req, res, next) {
   if (req.headers['x-forwarded-proto'] !== 'https') {
       return res.redirect(['https://', req.get('Host'), req.url].join(''));
   }
   return next();
};

app = express();
// app.use(cors({origin: '*'}));


/*

 Firebase setup

*/
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

app.use('/', express.static(__dirname));

// if (process.env.NODE_ENV === 'production') {
//     app.use(forceSsl);
// }

app.set('port', (process.env.PORT || 8080));

app.use(express.static("dist"));

app.get("/api/david/v0.00.00/think", function(req, res) {
  //Get up to 12 of the latest predictions
  //
  firebasePredictionsDB.ref().child("global").limitToFirst(12).once('value').then(function(snapshot) {

      if (snapshot.val()) {
        res.send(snapshot.val());
      } else {
        res.redirect('/');
        //
      }
  }, function(error) {
    console.log(error);
  });
});

app.get("/api/david/v0.00.00/site", function(req, res) {

  //Get up to 12 of the latest predictions
  //
  firebaseDB.ref().child("site").once('value').then(function(snapshot) {

      if (snapshot.val()) {
        res.send(snapshot.val());
      } else {
        res.redirect('/');
        //
      }
  }, function(error) {
    console.log(error);
  });
});

app.get('/terms', function(req, res) {
  // res.sendFile(path.join(__dirname, '../privacy_policy.pdf'), function(err) {
  //   if (err) {
  //     res.status(500).send(err)
  //   }
  // })
   res.redirect("https://www.iubenda.com/terms-and-conditions/17232390");
});

app.get('/privacy', function(req, res) {
  // res.sendFile(path.join(__dirname, '../privacy_policy.pdf'), function(err) {
  //   if (err) {
  //     res.status(500).send(err)
  //   }
  // })
   res.redirect("https://www.iubenda.com/privacy-policy/17232390");
});

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, '../dist/index.html'), function(err) {
    if (err) {
      res.status(500).send(err)
    }
  })
});
//
// app.get('/*', function(req, res) => {}
//   res.sendFile(path.resolve(__dirname, 'index.html'));
// });
//
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, 'index.html'));
// });

app.listen(app.get('port'), function () {
    console.log(`Node app is running on port: ${app.get('port')}`)
})
