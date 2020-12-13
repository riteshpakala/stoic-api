import React from 'react';
import PropTypes from 'prop-types';
import './style.css';
import '../../constants/GlobalStyle.css';

class Prediction extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
        ticker: "$unkown",
        tradingDay: "unknown",
        predictionDays: 7,
        close: "$0.00",
        s_pos: "0%",
        s_neg: "0%",
        s_neu: "0%",
        s_compound: "0.0",
        modelId: "unknown"
    };
  }

  componentDidMount() {
    fetch('/api/david/v0.00.00/think').then(results => {
      return results.json();
    }).then(data => {
      Object.values(data).forEach(value => {
        //First key will be the ticker
        let tickerKeys = Object.keys(value);

        //TICKER
        if (tickerKeys.length > 0) {
          let TICKER = tickerKeys[0];

          let stockDetail = value[TICKER];

          //the next key will be the trading day
          //and then all the settings
          let dateKeys = Object.keys(stockDetail);

          //DATE
          if (dateKeys.length > 0) {
              let stockDetailExpanded = stockDetail[dateKeys[dateKeys.length - 1]];
              let predictionPlacedKeys = Object.keys(stockDetailExpanded);

              if (predictionPlacedKeys.length > 0) {
                  let ACCESS_KEY = predictionPlacedKeys[predictionPlacedKeys.length - 1];
                  let predictionDetails = stockDetailExpanded[ACCESS_KEY];

                  let MODEL = predictionDetails["model"];

                  let PREDICTION_DAYS = MODEL["predictionDays"];
                  let CLOSE = MODEL["close"];
                  let TRADING_DAY = MODEL["nextTradingDay"];

                  let SENTIMENT = MODEL["sentimentWeights"];
                  let SENTIMENT_DETAILS = SENTIMENT[ACCESS_KEY]["model"]["sentimentData"]["dict"][0][ACCESS_KEY]["model"];

                  let S_POS = SENTIMENT_DETAILS["pos"];
                  let S_NEG = SENTIMENT_DETAILS["neg"];
                  let S_COMPOUND = SENTIMENT_DETAILS["compound"];
                  let S_NEU = SENTIMENT_DETAILS["neu"];

                  let ID = "unknown";
                  let modelKeys = Object.keys(MODEL);
                  // console.log(modelKeys);
                  if (modelKeys.includes("id")) {
                      let idExpanded = MODEL["id"];
                      let idSplit = idExpanded.split("-");
                      if (idSplit.length > 0) {
                         ID = idSplit[idSplit.length - 1].toLowerCase();
                      }
                  }

                  this.setState({
                    ticker: "$"+TICKER,
                    tradingDay: TRADING_DAY,
                    predictionDays: PREDICTION_DAYS.toString(),
                    close: "$"+(Math.round(CLOSE * 100) / 100).toString(),
                    s_pos: (Math.round(S_POS * 100) / 100).toString()+"%",
                    s_neg: (Math.round(S_NEG * 100) / 100).toString()+"%",
                    s_neu: (Math.round(S_NEU * 100) / 100).toString()+"%",
                    s_compound: S_COMPOUND,
                    modelId: ID
                  });
              }
          }
        }

      });
    })
  }

  render() {
    return (
    <div>
        <div className="prediction">
            <div className="predictionContainer stoicMarbleBrownGradient dropShadow stoicBlack">
                <div className="predictionHeaderContainer courierMedium">
                    <div className="modelDetailsContainer">
                        <p className="modelID">{this.state.modelId}</p>
                        <p className="daysTrained">days trained: {this.state.predictionDays}</p>
                    </div>
                    <div className="tickerDetailsContainer">
                        <p className="date stoicGreen">{this.state.tradingDay}</p>
                        <p className="ticker stoicGreen">{this.state.ticker}</p>
                    </div>
                </div>
                <div className="predictionSentimentContainer courierSmall">
                    <div className="predictionBasicContainer">
                        <p className="predictionBasic stoicBlack">positive: {this.state.s_pos}</p>
                        <p className="predictionBasic stoicBlack">negative: {this.state.s_neg}</p>
                    </div>
                    <div className="predictiondDetailsContainer">
                        <p className="predictionDetails stoicBlack">Δ: {this.state.s_neu}</p>
                        <p className="predictionDetails stoicBlack">λ: {this.state.s_compound}</p>

                    </div>
                </div>
                <div className="predictionOutputContainer stoicPurple courierSmall">
                    <p>close: {this.state.close}</p>
                </div>
            </div>
        </div>
    </div>
    )
  }
}

// Header.propTypes ={
//     title:PropTypes.string.isRequired,
//     titleLink:PropTypes.string.isRequired,
//     subtitle:PropTypes.string.isRequired,
//     detail1:PropTypes.string.isRequired,
//     detail1Link:PropTypes.string.isRequired,
//     detail2:PropTypes.string.isRequired,
//     detail2Link:PropTypes.string.isRequired,
// }

// Header.defaultProps = {
//     title: '* stoic',
//     titleLink: '',
//     subtitle: 'engine: david.v0.00.00',
//     detail1: 'email',
//     detail1Link: 'mailto:team@linenandsole.com',
//     detail2: 'discord',
//     detail2Link: 'https://discord.gg/VFfE8PT',
// };

export default Prediction;
