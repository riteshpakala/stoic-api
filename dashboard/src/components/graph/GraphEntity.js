import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './style.css';
import '../../constants/GlobalStyle.css';
import * as d3 from "d3";
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://192.168.1.29:8000/";

class GraphEntity extends React.Component {

  constructor(props) {
    super(props);

    this.setup = this.setup.bind(this);
    this.drawChartGreen = this.drawChartGreen.bind(this);
    this.drawChartRed = this.drawChartRed.bind(this);
    this.addGlow = this.addGlow.bind(this);
    this.stockAttr = this.stockAttr.bind(this);
    this.addPredictionLine = this.addPredictionLine.bind(this);

    this.state = {
      width: 400,
      height: 320,
      isGainer: true,
      positiveSentiment: "0%",
      negativeSentiment: "0%",
      neutralSentiment: "0%",
      currentPrice: "$000.00",
      currentError: "0%",
      type: "close",
      daysTrained: 0};
  }

  componentWillMount() {

  }

  componentDidMount() {
    this.setup(this.props);


    const socket = socketIOClient(ENDPOINT);


    socket.on("hello", data => {
      if (data.data.symbol.toLowerCase() == "$"+this.state.symbol.toLowerCase()) {
        fetch('/api/david/v0.00.00/stock/predict/'+data.data.symbol.toUpperCase()+'?neu='+data.data.neu+'&neg='+data.data.neg+'&pos='+data.data.pos+'&type='+this.state.type).then(results => {
            return results;
        }).then(data => {
            return data.json();
        }).then(json => {
            let jsonAggregratedData = this.state.newData;
            let lastValue = jsonAggregratedData[jsonAggregratedData.length - 2];
            let jsonData = {};
            jsonData["date"] = Date.parse(json.nextTradingDate);
            jsonData["dateString"] = json.nextTradingDate;
            jsonData["value"] = parseFloat(json.prediction);
            jsonAggregratedData[jsonAggregratedData.length - 1] = jsonData;

            console.log(jsonAggregratedData[0]);
            let change = parseFloat(json.prediction) - parseFloat(jsonAggregratedData[0].value);
            change = (Math.round(change * 100) / 100).toFixed(2); //**** */
            var diffPercentage = (parseFloat(json.prediction) * 100) / parseFloat(jsonAggregratedData[0].value) - 100;

            d3.select(".company__price"+this.state.symbol).html(`<span>\$${json.prediction}</span>`);
            d3.select(".company__price-change"+this.state.symbol).html(
              `<span>\$${change}(${diffPercentage.toFixed(2)}%)</span>`
            )
            d3.select("#userUpdated"+this.state.symbol).html(
              `<span>@${data.data.user}</span>`
            )

            var el = document.getElementById('userUpdated'+this.state.symbol);
            el.style.animation = 'none';
            el.offsetHeight; /* trigger reflow */
            el.style.animation = null;

            let floatCurrentPrice = parseFloat(this.state.currentPrice.split("$")[1]);
            let floatPreditionPrice = parseFloat(json.prediction);
            let error = (floatPreditionPrice - floatCurrentPrice)/floatCurrentPrice;

            this.setState({
              newData: jsonAggregratedData,
               isGainer: jsonData.value > lastValue.value,
               positiveSentiment: (parseFloat(json.posValue)*100).toString()+"%",
               negativeSentiment: (parseFloat(json.negValue)*100).toString()+"%",
               neutralSentiment: (parseFloat(json.neuValue)*100).toString()+"%",
               currentError: (((error*100).toFixed(2)).toString())+"%"});

        });
      }
    });

    socket.on("world", data => {
      fetch('/api/david/v0.00.00/stock/price/'+this.state.symbol).then(results => {
          return results;
      }).then(data => {
          return data.json();
      }).then(json => {
          let lastItem = json[json.length - 1];
          let stockValue = this.stockAttr(lastItem);

          console.log(lastItem);
          let floatCurrentPrice = parseFloat(stockValue);
          let floatPreditionPrice = parseFloat(this.state.newData[this.state.newData.length-1].value);
          let error = (floatPreditionPrice - floatCurrentPrice)/floatCurrentPrice;

          this.setState({
             currentPrice: "$"+stockValue,
             currentError: (((error*100).toFixed(2)).toString())+"%",
             isPastGainer: floatCurrentPrice > parseFloat(this.state.lastPrice.split("$")[1])
           });
      });
    });

    socket.on("neutral$"+this.props.symbol.toLowerCase(), data => {
      ////// PLEASE ABSTRACT THIS OUT BRO
      fetch('/api/david/v0.00.00/stock/predict/$'+this.props.symbol.toUpperCase()+'?neu=0.5&neg=0.25&pos=0.25&type='+this.state.type).then(results => {
          return results;
      }).then(data => {
          return data.json();
      }).then(json => {
          let jsonAggregratedData = this.state.newData;
          let lastValue = jsonAggregratedData[jsonAggregratedData.length - 2];
          let jsonData = {};
          jsonData["date"] = Date.parse(json.nextTradingDate);
          jsonData["dateString"] = json.nextTradingDate;
          jsonData["value"] = parseFloat(json.prediction);
          jsonAggregratedData[jsonAggregratedData.length - 1] = jsonData;

          console.log(jsonAggregratedData[0]);
          let change = parseFloat(json.prediction) - parseFloat(jsonAggregratedData[0].value);
          change = (Math.round(change * 100) / 100).toFixed(2); //**** */
          var diffPercentage = (parseFloat(json.prediction) * 100) / parseFloat(jsonAggregratedData[0].value) - 100;

          d3.select(".company__price"+this.state.symbol).html(`<span>\$${json.prediction}</span>`);
          d3.select(".company__price-change"+this.state.symbol).html(
            `<span>\$${change}(${diffPercentage.toFixed(2)}%)</span>`
          )
          d3.select("#userUpdated"+this.state.symbol).html(
            `<span>~thinking~</span>`
          )

          var el = document.getElementById('userUpdated'+this.state.symbol);
          el.style.animation = 'none';
          el.offsetHeight; /* trigger reflow */
          el.style.animation = null;

          let floatCurrentPrice = parseFloat(this.state.currentPrice.split("$")[1]);
          let floatPreditionPrice = parseFloat(json.prediction);
          let error = (floatPreditionPrice - floatCurrentPrice)/floatCurrentPrice;

          this.setState({
            newData: jsonAggregratedData,
             isGainer: jsonData.value > lastValue.value,
             positiveSentiment: (parseFloat(json.posValue)*100).toString()+"%",
             negativeSentiment: (parseFloat(json.negValue)*100).toString()+"%",
             neutralSentiment: (parseFloat(json.neuValue)*100).toString()+"%",
             currentError: (((error*100).toFixed(2)).toString())+"%"});

      });
    });


    socket.on("think$"+this.props.symbol.toLowerCase(), data => {
      console.log("Sup");

      console.log(data);

      let neu = (parseFloat(data.neuValue)).toFixed(3);
      let neg = (parseFloat(data.negValue)).toFixed(3);
      let pos = (parseFloat(data.posValue)).toFixed(3);
      ////// PLEASE ABSTRACT THIS OUT BRO
      fetch('/api/david/v0.00.00/stock/predict/$'+this.props.symbol.toUpperCase()+'?neu='+neu+'&neg='+neg+'&pos='+pos+'&type='+this.state.type).then(results => {
          return results;
      }).then(data => {
          return data.json();
      }).then(json => {
          let jsonAggregratedData = this.state.newData;
          let lastValue = jsonAggregratedData[jsonAggregratedData.length - 2];
          let jsonData = {};
          jsonData["date"] = Date.parse(json.nextTradingDate);
          jsonData["dateString"] = json.nextTradingDate;
          jsonData["value"] = parseFloat(json.prediction);
          jsonAggregratedData[jsonAggregratedData.length - 1] = jsonData;

          console.log(jsonAggregratedData[0]);
          let change = parseFloat(json.prediction) - parseFloat(jsonAggregratedData[0].value);
          change = (Math.round(change * 100) / 100).toFixed(2); //**** */
          var diffPercentage = (parseFloat(json.prediction) * 100) / parseFloat(jsonAggregratedData[0].value) - 100;

          d3.select(".company__price"+this.state.symbol).html(`<span>\$${json.prediction}</span>`);
          d3.select(".company__price-change"+this.state.symbol).html(
            `<span>\$${change}(${diffPercentage.toFixed(2)}%)</span>`
          )
          d3.select("#userUpdated"+this.state.symbol).html(
            `<span>~thinking~</span>`
          )

          var el = document.getElementById('userUpdated'+this.state.symbol);
          el.style.animation = 'none';
          el.offsetHeight; /* trigger reflow */
          el.style.animation = null;

          let floatCurrentPrice = parseFloat(this.state.currentPrice.split("$")[1]);
          let floatPreditionPrice = parseFloat(json.prediction);
          let error = (floatPreditionPrice - floatCurrentPrice)/floatCurrentPrice;

          this.setState({
            newData: jsonAggregratedData,
             isGainer: jsonData.value > lastValue.value,
             positiveSentiment: (parseFloat(json.posValue)*100).toString()+"%",
             negativeSentiment: (parseFloat(json.negValue)*100).toString()+"%",
             neutralSentiment: (parseFloat(json.neuValue)*100).toString()+"%",
             currentError: (((error*100).toFixed(2)).toString())+"%"});

      });
    });
  }

  componentWillUnmount() {
  }

  componentWillReceiveProps(nextProps) {
    this.setup(nextProps);
  }

  setup(nextProps) {
    let resizedWidth = nextProps.width*0.9;
    let resizedHeight = resizedWidth*0.4;

    let jsonAggregratedData = [];
    for (const item in nextProps.data) {
      let jsonData = {};
      jsonData["date"] = Date.parse(nextProps.data[item].Date);
      jsonData["dateString"] = nextProps.data[item].Date;
      jsonData["value"] = parseFloat(this.stockAttr(nextProps.data[item]));
      jsonAggregratedData.push(jsonData);
    }

    let today = new Date();
    // today.setDate(today.getDate()-1);
    let dd = today.getDate();
    let mm = today.getMonth()+1;
    let yyyy = today.getFullYear();


    let currentPrice = parseFloat(jsonAggregratedData[jsonAggregratedData.length - 1].value);
    let lastPrice = parseFloat(jsonAggregratedData[jsonAggregratedData.length - 2].value);
    if(jsonAggregratedData[jsonAggregratedData.length - 1].dateString == yyyy+'-'+mm+'-'+dd) {
      jsonAggregratedData.pop();
    }


    d3.select(".company__title"+nextProps.symbol).html(`<span>\$${nextProps.symbol}</span>`);

    fetch('/api/david/v0.00.00/stock/predict/$'+nextProps.symbol.toUpperCase()+'?neu=0.5&neg=0.25&pos=0.25&type='+this.state.type).then(results => {
        return results;
    }).then(data => {
        return data.json();
    }).then(json => {
        let lastValue = jsonAggregratedData[Object.keys(jsonAggregratedData).pop()]

        let jsonData = {};
        jsonData["date"] = Date.parse(json.nextTradingDate);
        jsonData["dateString"] = json.nextTradingDate;
        jsonData["value"] = parseFloat(json.prediction);
        jsonAggregratedData.push(jsonData);

        // d3.select(".positive_sentiment"+this.state.symbol).html(
        //   `<span>${parseFloat(json.posValue)*100}%</span>`
        // );
        //
        // d3.select(".negative_sentiment"+this.state.symbol).html(
        //   `<span>${parseFloat(json.negValue)*100}%</span>`
        // );
        //
        // d3.select(".neutral_sentiment"+this.state.symbol).html(
        //   `<span>${parseFloat(json.neuValue)*100}%</span>`
        // );

        let floatCurrentPrice = parseFloat(currentPrice);
        let floatPreditionPrice = parseFloat(json.prediction);
        let error = (floatPreditionPrice - floatCurrentPrice)/floatCurrentPrice;

        this.setState({
          width: resizedWidth,
           height: resizedHeight,
            symbol: nextProps.symbol,
             newData: jsonAggregratedData,
              isGainer: jsonData.value > lastValue.value,
              positiveSentiment: (parseFloat(json.posValue)*100).toString()+"%",
              negativeSentiment: (parseFloat(json.negValue)*100).toString()+"%",
              neutralSentiment: (parseFloat(json.neuValue)*100).toString()+"%",
              currentPrice: "$"+currentPrice.toString(),
              currentError: (((error*100).toFixed(3)).toString())+"%",
              lastPrice: "$"+lastPrice.toString(),
              isPastGainer: currentPrice > lastValue.value,
              daysTrained: json.daysTrained});

    });

  }

  stockAttr(data) {
    switch (this.state.type) {
      case "close":
        return data.Close;
        case "open":
          return data.Open;
          case "high":
            return data.High;
            case "low":
              return data.Low;
              case "volume":
                return data.Volume;
    }
  }

  componentDidUpdate() {
    d3.select("#svg"+this.state.symbol).remove();
    d3.select("#svgprediction"+this.state.symbol).remove();

    if (this.state.isGainer) {

      this.drawChartGreen(this.state.newData);
    } else {

      this.drawChartRed(this.state.newData);
    }
  }

  render() {

    return (
    <div className="company__body courierMedium">
      <div id= {"userUpdated"+`${this.state.symbol}`} className="userUpdated courierSemiLarge">
        user updated
      </div>
      <div className="companyMetadata">
        <div className={"company__title"+`${this.state.symbol}`+" graphTitle courierLarge "+`${this.state.isGainer ? "stoicGreen" : "stoicRed"}`}>
        </div>
        <div className={"company__price"+`${this.state.symbol}`+" graphPrice courierSemiLarge"}>
        </div>
        <div className={"company__price-change"+`${this.state.symbol}`+" graphPriceChange courierMedium"}>
        </div>
        <div className={"daysTrained"+`${this.state.symbol}`+" graphDaysTrained courierMedium"}>
          days trained: { this.state.daysTrained }
        </div>
      </div>
      <div className="sentimentMetadata">
        <div className="sentimentContainer">
        <div className={"positive_sentiment"+`${this.state.symbol}`+" graphSentiment courierMedium"}>
          <span> { "postive sentiment: "+`${ this.state.positiveSentiment }` } </span>
        </div>
        <div className={"negative_sentiment"+`${this.state.symbol}`+" graphSentiment courierMedium"}>
          <span> { "negative sentiment: "+`${ this.state.negativeSentiment }` } </span>
        </div>
        <div className={"neutral_sentiment"+`${this.state.symbol}`+" graphSentiment courierMedium"}>
          <span> { "neutral sentiment: "+`${ this.state.neutralSentiment }` } </span>
        </div>
        </div>
      </div>
      <div className="spacerForChart"> </div>
      <div className="company__chart-container graphChartContainer">
        <div className={"company__chart"+`${this.state.symbol}`}>
        </div>
        <div className={"company__chart_prediction"+`${this.state.symbol}`+" graphChartPrediction "+`${this.state.isGainer ? "graphChartFlickerGreen" : "graphChartFlickerRed"}`}>
        </div>
        <div className="company__chart-select-container">
          <div className="company__chart-select-1"></div>
        </div>
      </div>

      <div className= "backtestSuperContainer">
        <div className="actualsLabels">
          <span>actuals:</span>
        </div>
        <div className= "backtest">
          <span id={"currentPrice"+`${this.state.symbol}`} className="currentPrice courierMedium"> live: <span className= {`${this.state.isPastGainer ? "isGainerText" : "isLoserText"}`}>{this.state.currentPrice}</span> :: last: { this.state.lastPrice } </span>
          <div className="backTestContainer">
            <span id={"currentError"+`${this.state.symbol}`}  className="currentError courierSmall"> error: {this.state.currentError} </span>
            <div className="liveBacktestIndicatorContainer">

            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }


  drawChartGreen(data) {
    // set the dimensions and margins of the graph
    var margin = {
        top: 90,
        right: 20,
        bottom: 30,
        left: 20,
      },
      width = this.state.width - margin.left - margin.right,
      height = this.state.height - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3
      .select(".company__chart"+this.state.symbol)
      .append("svg")
      .attr("id", "svg"+this.state.symbol)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis --> it is a date format
    var x = d3
      .scaleTime()
      .domain(
        d3.extent(data, function (d) {
          return d.date;
        })
      )
      .rangeRound([0, width]);
    svg.append("g").attr("transform", "translate(0," + height + ")");
    //   .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return d.value;
        })
      )
      .rangeRound([height, 0]);

    //   This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function (d) {
      return d.date;
    }).left;

    // Create the circle that travels along the curve of chart
    var focus = svg
      .append("g")
      .append("circle")
      .style("fill", "rgba(0,200,5,1)")
      .attr("stroke", "rgba(0,200,5,1)")
      .attr("r", 4)
      .style("opacity", 0);

    // Create the text that travels along the curve of chart
    var focusText = svg
      .append("g")
      .append("text")
      .style("opacity", 0)
      .style("fill", "grey")
      .attr("text-anchor", "left")
      .attr("alignment-baseline", "middle");

    // let lastItem = data.pop();
    // console.log(data);
    // console.log(lastItem);
    // Add the line
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "rgba(0,200,5,1)")
      .attr("stroke-width", 4.0)
      .attr("stroke-linecap", "round")
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(d.date);
          })
          .y(function (d) {
            return y(d.value);
          })
      );

/// PREDICTION LINE

      let items = data.slice(data.length - 2, data.length);

      let svgPrediction = this.addPredictionLine(items, width, height, margin, x, y, "0,200,5");
      var defsPrediction = svgPrediction.append("defs");
      this.addGlow(defsPrediction);

      var defs = svg.append("defs");
      let colorMatrix = "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0";
      ///-------
      //Filter for the outside glow
      var filter = defs.append("filter")
          .attr("id","shadow")
      filter.append("feColorMatrix")
        .attr("type", "matrix")
        .attr("values", colorMatrix)
      filter.append("feGaussianBlur")
          .attr("stdDeviation","4.8")
          .attr("result","coloredBlur");
      var feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode")
          .attr("in","coloredBlur");
      feMerge.append("feMergeNode")
          .attr("in","SourceGraphic");
      //----append the svg object to the body of the page

      d3.selectAll("#svg"+this.state.symbol)
          .style("filter", "url(#shadow)");


    //   // Create a rect on top of the svg area: this rectangle recovers mouse position
    svgPrediction
      .append("rect")
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseout", mouseout);

    //   // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover() {
      focus.style("opacity", 1);
      focusText.style("opacity", 1);
    }

    let symbol = this.state.symbol;
    d3.select(".company__title"+symbol).html(`<span>\$${symbol.toUpperCase()}</span>`);

    ///////////
    // console.log(selectedData.date, selectedData.value);
    var newDate = data[data.length-1].dateString;//.toDateString();
    var newVal = (Math.round(data[data.length-1].value * 100) / 100).toFixed(2);
    var diffVal = newVal - data[0].value; //***** */
    diffVal = (Math.round(diffVal * 100) / 100).toFixed(2); //**** */
    var diffPercentage = (newVal * 100) / data[0].value - 100;

    d3.select(".company__price"+symbol).html(`<span>\$${newVal}</span>`);
    d3.select(".company__price-change"+symbol).html(
      `<span>\$${diffVal}(${diffPercentage.toFixed(2)}%)</span>`
    ); //**** */
    /////

    function mousemove() {
      // recover coordinate we need
      var x0 = x.invert(d3.mouse(this)[0]);
      var i = bisect(data, x0, 1);
      var selectedData = data[i];
      // console.log(selectedData);
      var newDate = selectedData.dateString;//.toDateString();
      var newVal = (Math.round(selectedData.value * 100) / 100).toFixed(2);
      focus.attr("cx", x(selectedData.date)).attr("cy", y(selectedData.value));
      focusText
        .html(newDate)
        .attr("x", x(selectedData.date) + -70)
        .attr("y", y(selectedData.value) + -40);
      // console.log(selectedData.date, selectedData.value);
      var diffVal = newVal - data[0].value; //***** */
      diffVal = (Math.round(diffVal * 100) / 100).toFixed(2); //**** */
      var diffPercentage = (newVal * 100) / data[0].value - 100;

      d3.select(".company__price"+symbol).html(`<span>\$${newVal}</span>`);
      d3.select(".company__price-change"+symbol).html(
        `<span>\$${diffVal}(${diffPercentage.toFixed(2)}%)</span>`
      ); //**** */
    }
    function mouseout() {
      focus.style("opacity", 0);
      focusText.style("opacity", 0);
      var moveVal = (Math.round(data[data.length - 1].value * 100) / 100).toFixed(
        2
      );
      var diffVal =
        (Math.round(data[data.length - 1].value * 100) / 100).toFixed(2) - //**** */
        (Math.round(data[0].value * 100) / 100).toFixed(2); //**** */
      var diffPercentage =
        ((Math.round(data[data.length - 1].value * 100) / 100).toFixed(2) * 100) / //**** */
          (Math.round(data[0].value * 100) / 100).toFixed(2) - //*** */
        100; //**** */
      d3.select(".company__price"+symbol).html(`<span> \$${moveVal}</span>`);
      d3.select(".company__price-change"+symbol).html(
        //**** */
        `<span>\$${diffVal.toFixed(2)}(${diffPercentage.toFixed(2)}%)</span>` //**** */
      ); //**** */
    }
  }

  drawChartRed(data) {
    // set the dimensions and margins of the graph
    var margin = {
        top: 90,
        right: 30,
        bottom: 30,
        left: 20,
      },
      width = this.state.width - margin.left - margin.right,
      height = this.state.height - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3
      .select(".company__chart"+this.state.symbol)
      .append("svg")
      .attr("id", "svg"+this.state.symbol)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis --> it is a date format
    var x = d3
      .scaleTime()
      .domain(
        d3.extent(data, function (d) {
          return d.date;
        })
      )
      .rangeRound([0, width]);
    svg.append("g").attr("transform", "translate(0," + height + ")");
    //   .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return d.value;
        })
      )
      .rangeRound([height, 0]);

    //   This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function (d) {
      return d.date;
    }).left;

    // Create the circle that travels along the curve of chart
    var focus = svg
      .append("g")
      .append("circle")
      .style("fill", "rgba(255,80,0,1)")
      .attr("stroke", "rgba(255,80,0,1)")
      .attr("r", 4)
      .style("opacity", 0);

    // Create the text that travels along the curve of chart
    var focusText = svg
      .append("g")
      .append("text")
      .style("opacity", 0)
      .style("fill", "grey")
      .attr("text-anchor", "left")
      .attr("alignment-baseline", "middle");

    // Add the line
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,80,0,1)")
      .attr("stroke-width", 4.0)
      .attr("stroke-linecap", "round")
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(d.date);
          })
          .y(function (d) {
            return y(d.value);
          })
      );

      /// PREDICTION LINE

      let items = data.slice(data.length - 2, data.length);

      let svgPrediction = this.addPredictionLine(items, width, height, margin, x, y, "255,80,0");
      var defsPrediction = svgPrediction.append("defs");
      this.addGlow(defsPrediction);

      var defs = svg.append("defs");
      let colorMatrix = "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0";
      ///-------
      //Filter for the outside glow
      var filter = defs.append("filter")
          .attr("id","shadow")
      filter.append("feColorMatrix")
        .attr("type", "matrix")
        .attr("values", colorMatrix)
      filter.append("feGaussianBlur")
          .attr("stdDeviation","4.8")
          .attr("result","coloredBlur");
      var feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode")
          .attr("in","coloredBlur");
      feMerge.append("feMergeNode")
          .attr("in","SourceGraphic");
      //----append the svg object to the body of the page

      d3.selectAll("#svg"+this.state.symbol)
          .style("filter", "url(#shadow)");

    //   // Create a rect on top of the svg area: this rectangle recovers mouse position
    svgPrediction
      .append("rect")
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr("width", width)
      .attr("height", height)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseout", mouseout);

    //   // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover() {
      focus.style("opacity", 1);
      focusText.style("opacity", 1);
    }

    let symbol = this.state.symbol;
    d3.select(".company__title"+symbol).html(`<span>\$${symbol.toUpperCase()}</span>`);

    ///////////
    // console.log(selectedData.date, selectedData.value);
    var newDate = data[data.length-1].dateString;//.toDateString();
    var newVal = (Math.round(data[data.length-1].value * 100) / 100).toFixed(2);
    var diffVal = newVal - data[0].value; //***** */
    diffVal = (Math.round(diffVal * 100) / 100).toFixed(2); //**** */
    var diffPercentage = (newVal * 100) / data[0].value - 100;

    d3.select(".company__price"+symbol).html(`<span>\$${newVal}</span>`);
    d3.select(".company__price-change"+symbol).html(
      `<span>\$${diffVal}(${diffPercentage.toFixed(2)}%)</span>`
    ); //**** */
    /////

    function mousemove() {
      // recover coordinate we need
      var x0 = x.invert(d3.mouse(this)[0]);
      var i = bisect(data, x0, 1);
      var selectedData = data[i];
      // console.log(selectedData);
      var newDate = selectedData.dateString;//.toDateString();
      var newVal = (Math.round(selectedData.value * 100) / 100).toFixed(2);
      focus.attr("cx", x(selectedData.date)).attr("cy", y(selectedData.value));
      focusText
        .html(newDate)
        .attr("x", x(selectedData.date) + -70)
        .attr("y", y(selectedData.value) + -40);
      // console.log(selectedData.date, selectedData.value);
      var diffVal = newVal - data[0].value; //***** */
      diffVal = (Math.round(diffVal * 100) / 100).toFixed(2); //**** */
      var diffPercentage = (newVal * 100) / data[0].value - 100;

      d3.select(".company__price"+symbol).html(`<span>\$${newVal}</span>`);
      d3.select(".company__price-change"+symbol).html(
        `<span>\$${diffVal}(${diffPercentage.toFixed(2)}%)</span>`
      ); //**** */
    }
    function mouseout() {
      focus.style("opacity", 0);
      focusText.style("opacity", 0);
      var moveVal = (Math.round(data[data.length - 1].value * 100) / 100).toFixed(
        2
      );
      var diffVal =
        (Math.round(data[data.length - 1].value * 100) / 100).toFixed(2) - //**** */
        (Math.round(data[0].value * 100) / 100).toFixed(2); //**** */
      var diffPercentage =
        ((Math.round(data[data.length - 1].value * 100) / 100).toFixed(2) * 100) / //**** */
          (Math.round(data[0].value * 100) / 100).toFixed(2) - //*** */
        100; //**** */
      d3.select(".company__price"+symbol).html(`<span> \$${moveVal}</span>`);
      d3.select(".company__price-change"+symbol).html(
        //**** */
        `<span>\$${diffVal.toFixed(2)}(${diffPercentage.toFixed(2)}%)</span>` //**** */
      ); //**** */
    }
  }

  addGlow(defs) {
    let shadowCM1 = "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0";
    let shadowCM2 = "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0";
    let shadowCM3 = "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.8 0";
    let shadowCM4 = "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.69678442 0";
    let shadowCM5 = "0 0 0 0 0.314369351 0 0 0 0 0.8883757 0 0 0 0 0.759899616 0 0 0 0.649371603 0";

    //Filter for the outside glow
    var filter = defs.append("filter")
        .attr("id","glow"+this.state.symbol)
        .attr("filterUnits","userSpaceOnUse");

    filter.append("feOffset")
        .attr("in","SourceAlpha")
        .attr("result","shadowOffsetOuter1");
    filter.append("feGaussianBlur")
        .attr("stdDeviation","5")
        .attr("in","shadowOffsetOuter1")
        .attr("result","shadowBlurOuter1");
    filter.append("feColorMatrix")
        .attr("type","matrix")
        .attr("values",shadowCM1)
        .attr("in","shadowBlurOuter1")
        .attr("result","shadowMatrixOuter1");

    filter.append("feOffset")
        .attr("in","SourceAlpha")
        .attr("dy","1")
        .attr("result","shadowOffsetOuter2");
    filter.append("feGaussianBlur")
        .attr("stdDeviation","7")
        .attr("in","shadowOffsetOuter2")
        .attr("result","shadowBlurOuter2");
    filter.append("feColorMatrix")
        .attr("type","matrix")
        .attr("values",shadowCM2)
        .attr("in","shadowBlurOuter2")
        .attr("result","shadowMatrixOuter2");


    filter.append("feOffset")
      .attr("in","SourceAlpha")
      .attr("dy","2")
      .attr("result","shadowOffsetOuter3");
    filter.append("feGaussianBlur")
      .attr("stdDeviation","10")
      .attr("in","shadowOffsetOuter3")
      .attr("result","shadowBlurOuter3");
    filter.append("feColorMatrix")
      .attr("type","matrix")
      .attr("values",shadowCM3)
      .attr("in","shadowBlurOuter3")
      .attr("result","shadowMatrixOuter3");


    filter.append("feOffset")
      .attr("in","SourceAlpha")
      .attr("dx","2")
      .attr("dy","2")
      .attr("result","shadowOffsetOuter4");
    filter.append("feGaussianBlur")
      .attr("stdDeviation","4")//creates a singular baseline
      .attr("in","shadowOffsetOuter4")
      .attr("result","shadowBlurOuter4");
    filter.append("feColorMatrix")
      .attr("type","matrix")
      .attr("values",shadowCM4)
      .attr("in","shadowBlurOuter4")
      .attr("result","shadowMatrixOuter4");

    filter.append("feOffset")
      .attr("in","SourceAlpha")
      .attr("dy","2")
      .attr("result","shadowOffsetOuter5");
    filter.append("feGaussianBlur")
      .attr("stdDeviation","8")
      .attr("in","shadowOffsetOuter5")
      .attr("result","shadowBlurOuter5");
    filter.append("feColorMatrix")
      .attr("type","matrix")
      .attr("values",shadowCM5)
      .attr("in","shadowBlurOuter5")
      .attr("result","shadowMatrixOuter5");

    var feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
        .attr("in","shadowMatrixOuter1");
    feMerge.append("feMergeNode")
        .attr("in","shadowMatrixOuter2");
    feMerge.append("feMergeNode")
        .attr("in","shadowMatrixOuter3");
    feMerge.append("feMergeNode")
        .attr("in","shadowMatrixOuter4");
    feMerge.append("feMergeNode")
        .attr("in","shadowMatrixOuter5");
  }

  addPredictionLine(items, width, height, margin, x, y, color) {
    var svgPrediction = d3
      .select(".company__chart_prediction"+this.state.symbol)
      .append("svg")
      .attr("id", "svgprediction"+this.state.symbol)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // let i;
      // for (i = 0; i < 4; i++) {
      //   svgPrediction
      //     .append("path")
      //     .datum(items)
      //     .attr("fill", "#FFF")
      //     .attr("stroke", "rgba(255, 255, 255, 1)") //"+color+","+(1.0/i)+")")
      //     .attr("stroke-linecap", "round")
      //     .attr("stroke-width", 4.0)
      //     .attr("stroke-opacity", 1.0/i)
      //     .attr("id", "prediction")
      //     .attr(
      //       "d",
      //       d3
      //         .line()
      //         .x(function (d) {
      //           return x(d.date);
      //         })
      //         .y(function (d) {
      //           return y(d.value);
      //         })
      //     );
      // }

      svgPrediction
        .append("path")
        .datum(items)
        .attr("fill", "#FFF")
        .attr("stroke", "rgba(255, 255, 255, 1)") //"+color+","+(1.0/i)+")")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 4.0)
        .attr("id", "prediction")
        .attr(
          "d",
          d3
            .line()
            .x(function (d) {
              return x(d.date);
            })
            .y(function (d) {
              return y(d.value);
            })
        );

        ////
      //Apply to your element(s)
      d3.selectAll("#svgprediction"+this.state.symbol)
          .style("filter", "url(#glow"+this.state.symbol+")");

      return svgPrediction;
  }

  // drawChartRed(data) {
  //   // set the dimensions and margins of the graph
  //   var margin = {
  //       top: 50,
  //       right: 30,
  //       bottom: 30,
  //       left: 60,
  //     },
  //     width = ((700 - margin.left - margin.right) * this.props.widthRatio) * 0.4, //700 - margin.left - margin.right,
  //     height = 300 - margin.top - margin.bottom;
  //
  //   // append the svg object to the body of the page
  //   var svg = d3
  //     .select(".company__chart"+this.state.symbol)
  //     .append("svg")
  //     .attr("width", width + margin.left + margin.right)
  //     .attr("height", height + margin.top + margin.bottom)
  //     .append("g")
  //     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  //
  //   // Add X axis --> it is a date format
  //   var x = d3
  //     .scaleTime()
  //     .domain(
  //       d3.extent(data, function (d) {
  //         return d.date;
  //       })
  //     )
  //     .rangeRound([0, width]);
  //   svg.append("g").attr("transform", "translate(0," + height + ")");
  //   // .call(d3.axisBottom(x));
  //
  //   // Add Y axis
  //   var y = d3
  //     .scaleLinear()
  //     .domain(
  //       d3.extent(data, function (d) {
  //         return d.value;
  //       })
  //     )
  //     .rangeRound([height, 0]);
  //
  //   //   This allows to find the closest X index of the mouse:
  //   var bisect = d3.bisector(function (d) {
  //     return d.date;
  //   }).left;
  //
  //   // Create the circle that travels along the curve of chart
  //   var focus = svg
  //     .append("g")
  //     .append("circle")
  //     .style("fill", "rgba(255,80,0,1)")
  //     .attr("stroke", "rgba(255,80,0,1)")
  //     .attr("r", 4)
  //     .style("opacity", 0);
  //
  //   // Create the text that travels along the curve of chart
  //   var focusText = svg
  //     .append("g")
  //     .append("text")
  //     .style("opacity", 0)
  //     .style("fill", "grey")
  //     .attr("text-anchor", "left")
  //     .attr("alignment-baseline", "middle");
  //
  //   // Add the line
  //   svg
  //     .append("path")
  //     .datum(data)
  //     .attr("fill", "none")
  //     .attr("stroke", "rgba(255,80,0,1)")
  //     .attr("stroke-width", 1.5)
  //     .attr(
  //       "d",
  //       d3
  //         .line()
  //         .x(function (d) {
  //           return x(d.date);
  //         })
  //         .y(function (d) {
  //           return y(d.value);
  //         })
  //     );
  //
  //   //   // Create a rect on top of the svg area: this rectangle recovers mouse position
  //   svg
  //     .append("rect")
  //     .style("fill", "none")
  //     .style("pointer-events", "all")
  //     .attr("width", width)
  //     .attr("height", height)
  //     .on("mouseover", mouseover)
  //     .on("mousemove", mousemove)
  //     .on("mouseout", mouseout);
  //
  //   //   // What happens when the mouse move -> show the annotations at the right positions.
  //   function mouseover() {
  //     focus.style("opacity", 1);
  //     focusText.style("opacity", 1);
  //   }
  //
  //   let symbol = this.state.symbol;
  //   d3.select(".company__title"+symbol).html(`<span>\$${symbol}</span>`);
  //   function mousemove() {
  //     // recover coordinate we need
  //     var x0 = x.invert(d3.mouse(this)[0]);
  //     var i = bisect(data, x0, 1);
  //     var selectedData = data[i];
  //     // var newDate = selectedData.date.toDateString();
  //     var newVal = (Math.round(selectedData.value * 100) / 100).toFixed(2);
  //     focus.attr("cx", x(selectedData.date)).attr("cy", y(selectedData.value));
  //     focusText
  //       .html(selectedData.date)
  //       .attr("x", x(selectedData.date) + -70)
  //       .attr("y", y(selectedData.value) + -40);
  //     // console.log(selectedData.date, selectedData.value);
  //     var diffVal = newVal - data[0].value; //***** */
  //     diffVal = (Math.round(diffVal * 100) / 100).toFixed(2); //**** */
  //     var diffPercentage = (newVal * 100) / data[0].value - 100;
  //
  //     console.log(".company__price"+symbol);
  //     d3.select(".company__price"+symbol).html(`<span>\$${newVal}</span>`);
  //     d3.select(".company__price-change"+symbol).html(
  //       `<span>\$${diffVal}(${diffPercentage.toFixed(2)}%)</span>`
  //     ); //**** */
  //   }
  //   function mouseout() {
  //     focus.style("opacity", 0);
  //     focusText.style("opacity", 0);
  //     var moveVal = (Math.round(data[data.length - 1].value * 100) / 100).toFixed(
  //       2
  //     );
  //     var diffVal =
  //       (Math.round(data[data.length - 1].value * 100) / 100).toFixed(2) - //**** */
  //       (Math.round(data[0].value * 100) / 100).toFixed(2); //**** */
  //     var diffPercentage =
  //       ((Math.round(data[data.length - 1].value * 100) / 100).toFixed(2) * 100) / //**** */
  //         (Math.round(data[0].value * 100) / 100).toFixed(2) - //*** */
  //       100; //**** */
  //     d3.select(".company__price"+symbol).html(`<span> \$${moveVal}</span>`);
  //     d3.select(".company__price-change"+symbol).html(
  //       //**** */
  //       `<span>\$${diffVal.toFixed(2)}(${diffPercentage.toFixed(2)}%)</span>` //**** */
  //     ); //**** */
  //     // d3.select('.portfolio__header').html(`<span> \$${data[data.length - 1].value}</span>`)
  //   }
  // }
}

export default GraphEntity;
