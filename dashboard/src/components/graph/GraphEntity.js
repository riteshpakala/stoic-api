import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './style.css';
import '../../constants/GlobalStyle.css';
import * as d3 from "d3";

class GraphEntity extends React.Component {

  constructor(props) {
    super(props);

    this.setup = this.setup.bind(this);
    this.drawChartGreen = this.drawChartGreen.bind(this);
    this.drawChartRed = this.drawChartRed.bind(this);

    this.state = {
      width: 400,
      height: 160,
      isGainer: true };
  }

  componentWillMount() {

  }

  componentDidMount() {
    this.setup(this.props);
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
      jsonData["value"] = parseFloat(nextProps.data[item].Close);
      jsonAggregratedData.push(jsonData);
    }

    d3.select(".company__title"+nextProps.symbol).html(`<span>\$${nextProps.symbol}</span>`);

    fetch('/api/david/v0.00.00/stock/predict/$'+nextProps.symbol.toUpperCase()+'?neu=0.5&neg=0.25&pos=0.25&type=close').then(results => {
        return results;
    }).then(data => {
        return data.json();
    }).then(json => {
        let lastValue = jsonAggregratedData[Object.keys(jsonAggregratedData).pop()]
        console.log(lastValue);

        let jsonData = {};
        jsonData["date"] = Date.parse(json.nextTradingDate);
        jsonData["dateString"] = json.nextTradingDate;
        jsonData["value"] = parseFloat(json.prediction);
        jsonAggregratedData.push(jsonData);

        this.setState({width: resizedWidth, height: resizedHeight, symbol: nextProps.symbol, newData: jsonAggregratedData, isGainer: jsonData.value > lastValue.value});

    });
  }

  componentDidUpdate() {
    if (this.state.isGainer) {

      this.drawChartGreen(this.state.newData);
    } else {

      this.drawChartRed(this.state.newData);
    }
  }

  render() {

    return (
    <div className="company__body courierMedium">
      <div className={"company__title"+`${this.state.symbol}`+" graphTitle courierMedium"}>
      </div>
      <div className={"company__price"+`${this.state.symbol}`+" graphPrice courierMedium"}>
      </div>
      <div className={"company__price-change"+`${this.state.symbol}`+" graphPriceChange courierMedium"}>
      </div>
      <div className="company__chart-container">
        <div className={"company__chart"+`${this.state.symbol}`}>
        </div>
        <div className="company__chart-select-container">
          <div className="company__chart-select-1"></div>
        </div>
      </div>


    </div>
    )
  }


  drawChartGreen(data) {
    // set the dimensions and margins of the graph
    var margin = {
        top: 50,
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

    // Add the line
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "rgba(0,200,5,1)")
      .attr("stroke-width", 1.5)
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

    //   // Create a rect on top of the svg area: this rectangle recovers mouse position
    svg
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
    d3.select(".company__title"+symbol).html(`<span>\$${symbol}</span>`);

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
        top: 50,
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
      .attr("stroke-width", 1.5)
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

    //   // Create a rect on top of the svg area: this rectangle recovers mouse position
    svg
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
    d3.select(".company__title"+symbol).html(`<span>\$${symbol}</span>`);

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
