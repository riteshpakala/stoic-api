var fs = require('fs');
var path = require('path');
var express = require('express');
var cors = require('cors');
const fetch = require('node-fetch');
const csvtojson = require('csvtojson');
var bodyParser = require('body-parser');
const socketIo = require("socket.io");
var axios = require("axios").default;
var Twit = require('twit')

var T = new Twit({
  consumer_key:         'YfotrHzdTUfA1swS0MQj3cqdg',
  consumer_secret:      'BrCZ67oKoROeZJUPJ46bEqj8kNrJVE2MtHJDwrprMclpRqtDTE',
  access_token:         '1243717647356661760-fbtO5XfEMB4Vci6nIxkx8xErwQngEy',
  access_token_secret:  'ZSnUWusM2ozp2obOvbmRS5P96vpM1tZ8tbfXpHUYphSGN'
  // timeout_ms:           60*10,  // optional HTTP request timeout to apply to all requests.
  // strictSSL:            false,     // optional - requires SSL certificates to be valid.
})

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

app.set('port', (process.env.PORT || 8000));

app.use(express.static("dist"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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


//
//
//
//
app.get("/api/david/v0.00.00/stock/:id", function(req, res) {
    let stock = req.params.id;

    let todaysDate = new Date();
    let last30Days = new Date();
    last30Days.setDate(todaysDate.getDate()-30);

    let tDate_Epoch = (Math.floor((todaysDate.getTime()-last30Days.getMilliseconds())/1000)).toString();
    let l30Date_Epoch = (Math.floor((last30Days.getTime()-last30Days.getMilliseconds())/1000)).toString();

    let urlPrefix = "https://query1.finance.yahoo.com/v7/finance/download/";
    let urlSymbol = stock+"?period1="+l30Date_Epoch+"&period2="+tDate_Epoch;
    let urlInteval = "&interval=1d&events=history";

    let fullURL = urlPrefix+urlSymbol+urlInteval;
    fetch(fullURL)
      .then(res => res.text() )
      .then(text => {
          csvtojson({
              noheader: false,
              output: "json"
            })
            .fromString(text)
            .then((jsonObj) => {

                res.send(jsonObj);
            })
      });
    console.log(tDate_Epoch);
    console.log(l30Date_Epoch);

/*

≈
                  .fromFile(res)
                  .then((jsonObj)=>{

                      console.log(jsonObj);

                      return(jsonObj);
                  })


*/
});

//
app.get("/api/david/v0.00.00/stock/predict/:id", function(req, res) {
    let stock = req.params.id;
    let prediction = req.originalUrl.split("/stock")[1];

    if (req.originalUrl.split("$")[1].split("?")[0].length == 0) {
      console.log("sup");
    } else {
      console.log(req.originalUrl.split("/stock")[1]);
      fetch("http://localhost:8080"+prediction)
        .then(res => {
          return res.json();
        }).then(json => {
          console.log(json);
          return res.send(json);
        });

  /*

  ≈
                    .fromFile(res)
                    .then((jsonObj)=>{

                        console.log(jsonObj);

                        return(jsonObj);
                    })


  */
    }

});

app.post('/api/david/v0.00.00/stock/predict', function(req, res) {
  // res.sendFile(path.join(__dirname, '../privacy_policy.pdf'), function(err) {
  //   if (err) {
  //     res.status(500).send(err)
  //   }
  // })
  console.log(req.body);
  io.sockets.emit("hello", req.body);
   res.send();
});

app.post('/api/david/v0.00.00/stock/backtest', function(req, res) {
  // res.sendFile(path.join(__dirname, '../privacy_policy.pdf'), function(err) {
  //   if (err) {
  //     res.status(500).send(err)
  //   }
  // })
  io.sockets.emit("world", req.body);
   res.send();
});


app.post('/api/david/v0.00.00/stock/think', function(req, res) {
  // res.sendFile(path.join(__dirname, '../privacy_policy.pdf'), function(err) {
  //   if (err) {
  //     res.status(500).send(err)
  //   }
  // })

  console.log(req.body.data.symbol);
  let symbol = req.body.data.symbol.replace(/\s/g, "");
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth()+1;
  let yyyy = today.getFullYear();
  let date = yyyy+'-'+mm+'-'+dd;

  T.get('search/tweets', { q: symbol+' since:'+date, count: 100 }, function(err, data, response) {

    axios
        .get('http://localhost:8080/predict/think', {
          data : {
            tweet_data: data
          }
        })
        .then(json => {
          io.sockets.emit("think"+symbol, json.data);
          res.send(json.data);
        })
        .catch(error => {
          console.error(error)
        });

  });
});

app.post('/api/david/v0.00.00/stock/neutral', function(req, res) {
  // res.sendFile(path.join(__dirname, '../privacy_policy.pdf'), function(err) {
  //   if (err) {
  //     res.status(500).send(err)
  //   }
  // })

  console.log(req.body.data.symbol);
  console.log("Test");
  let symbol = req.body.data.symbol.replace(/\s/g, "");
  io.sockets.emit("neutral"+symbol, req.body.data);
  res.send();
});

app.get("/api/david/v0.00.00/stock/price/:id", function(req, res) {
    let stock = req.params.id;

    // var options = {
    //   method: 'GET',
    //   url: 'https://twelve-data1.p.rapidapi.com/price',
    //   params: {symbol: stock, outputsize: '30', format: 'json'},
    //   headers: {
    //     'x-rapidapi-key': '0c0e4882d8mshff3f1b457562c64p12c681jsn48b2eeb37946',
    //     'x-rapidapi-host': 'twelve-data1.p.rapidapi.com'
    //   }
    // };
    //
    // axios.request(options).then(function (response) {
    // 	console.log(response.data);
    //   res.send(response.data);
    // }).catch(function (error) {
    // 	console.error(error);
    // });

    let todaysDate = new Date();
    let last30Days = new Date();
    last30Days.setDate(todaysDate.getDate()-1);

    let tDate_Epoch = (Math.floor((todaysDate.getTime()-last30Days.getMilliseconds())/1000)).toString();
    let l30Date_Epoch = (Math.floor((last30Days.getTime()-last30Days.getMilliseconds())/1000)).toString();

    let urlPrefix = "https://query1.finance.yahoo.com/v7/finance/download/";
    let urlSymbol = stock+"?period1="+l30Date_Epoch+"&period2="+tDate_Epoch;
    let urlInteval = "&interval=1d&events=history";

    let fullURL = urlPrefix+urlSymbol+urlInteval;
    fetch(fullURL)
      .then(res => res.text() )
      .then(text => {
          csvtojson({
              noheader: false,
              output: "json"
            })
            .fromString(text)
            .then((jsonObj) => {

                res.send(jsonObj);
            })
      });

/*

≈
                  .fromFile(res)
                  .then((jsonObj)=>{

                      console.log(jsonObj);

                      return(jsonObj);
                  })


*/
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

const http = require('http').Server(app);

const io = require('socket.io')(http, {
  cors: {
    origin: "http://192.168.1.39:8001",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
    //your code here
    console.log("connected");
})

const server = http.listen(app.get('port'), () => {
      console.log('Started');
});

// app.listen(app.get('port'), function () {
//     console.log(`Node app is running on port: ${app.get('port')}`)
// })
