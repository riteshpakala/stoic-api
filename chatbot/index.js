const express = require('express');
const tmi = require("tmi.js");
const app = express();
const axios = require('axios');

// Glitch expects a web server so we're starting express to take care of that.
// The page shows the same information as the readme and includes the remix button.
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

let listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

// Setting options for our bot, disable debug output once your up and running.
let options = {
  options: {
    debug: true
  },
  connection: {
    cluster: "aws",
    reconnect: true
  },
  identity: {
    username: "SenecaStoic",
    password: "oauth:4qz3do71pz9s5lke6kytbvmcb8ophk"
  },
    channels: ["stoic_nyc"]
};

// Set up our new TMI client and connect to the server.
let client =  new tmi.client(options);
client.connect();

// We have debug enabled now but if not we want some sort of confirmation
// we've connected to the server.
client.on('connected', (address, port) => {
  console.log(`Connected to ${address}:${port}`);
})

// This simple bot will simply monitor chat logging for instances of '!twitter' or '!github'.
//
client.on('chat', (channel, user, message, self) => {
  let match = message.match(/(^|\s)(\$[a-z]+\b)/gi);

  if (match != null) {
    if(message.includes("!think") && message.includes("!neutral") == false) {

      let BreakException = {};

      try {
        match.forEach(function(match) {
          client.action('stoic_nyc', "thinking about "+match+"...");

          axios
            .post('http://localhost:8000/api/david/v0.00.00/stock/think', {
              data : {
                symbol: match
              }
            })
            .then(res => {
              // console.log(`statusCode: ${res.statusCode}`);

              let neu = ((parseFloat(res.data.neuValue)).toFixed(3)*100).toString()+"%";
              let neg = ((parseFloat(res.data.negValue)).toFixed(3)*100).toString()+"%";
              let pos = ((parseFloat(res.data.posValue)).toFixed(3)*100).toString()+"%";

              client.action('stoic_nyc', "discovered & updated this sentiment summary //:: neutral: "+neu+" - negative: "+neg+" - positive: "+pos+" //:: for: "+match+" //:: sentiment engine: david.v00.00.10");
            })
            .catch(error => {
              console.error(error)
            });

            throw breakException;
        });
      } catch (e) {
        //
      }
    } else if (message.includes("!stoic") && message.includes("!think") == false) {
      try {
        match.forEach(function(match) {
          client.action('stoic_nyc', "stoic understood to look at "+match+"...");


          axios
            .post('http://localhost:8000/api/david/v0.00.00/stock/neutral', {
              data : {
                symbol: match
              }
            })
            .then(res => {

              client.action('stoic_nyc', "stoic'ly looking at "+match+"...");
            })
            .catch(error => {
              console.error(error)
            });

            throw breakException;
        });
      } catch (e) {
        //
      }
    } else {
      match.forEach(function(match) {
        // match looks like '$AAPL'

        client.action('stoic_nyc', "updating the prediction for "+match);

        let pos = "0.25";
        let neg = "0.5";
        let neu = "0.12";

        let split = message.split(match);
        if (split.length >= 2) {
          let emotions = message.split(match)[1].split("/");

          if (emotions.length == 3) {
            pos = emotions[0].replace(/\s/g, "");
            neg = emotions[1].replace(/\s/g, "");
            neu = emotions[2].replace(/\s/g, "");
          }
        }

        console.log(pos+" / "+neg+" / "+neu+" / ");

        axios
          .post('http://localhost:8000/api/david/v0.00.00/stock/predict', {
            data : {
              symbol: match,
              pos: pos,
              neg: neg,
              neu: neu,
              user: user['display-name']
            }
          })
          .then(res => {
            console.log(`statusCode: ${res.statusCode}`)
            console.log(res);
          })
          .catch(error => {
            console.error(error)
          });

      });
    }

  } else {

    switch(message) {
      case '!twitter':
        client.action('stoic_nyc', `${user['display-name']} you can find it at https://twitter.com/stoic_nyc`);
        break;
      case '!website':
        client.action('stoic_nyc', `${user['display-name']} here: https://stoic.nyc`);
        break;
      case '!commands':
        client.action('stoic_nyc', `${user['display-name']} [$TICKER] [POS]/[NEG]/[NEU]`);
        break;
      case '!discord':
        client.action('stoic_nyc', `${user['display-name']} found it: https://discord.gg/VFfE8PT`);
        break;
      case '!backtest':
      client.action('stoic_nyc', "backtesting each stock & updating the realtime error");
      axios
        .post('http://localhost:8000/api/david/v0.00.00/stock/backtest')
        .then(res => {
          console.log(`statusCode: ${res.statusCode}`)
          // console.log(res)
        })
        .catch(error => {
          console.error(error)
        });
        break;
      default:
        break;
    }
  }

})
