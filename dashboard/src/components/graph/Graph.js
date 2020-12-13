import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './style.css';
import '../../constants/GlobalStyle.css';

import GraphEntity from './GraphEntity';

class Graph extends React.Component {

  constructor(props) {
    super(props);

    this.onMouseUp = this.onMouseUp.bind(this);
    this.siphon = this.siphon.bind(this);
    this.state = {
      data:[],
      dataSymbols: [],
      count: 0,
      siphonSymbols: []};
  }

  componentWillMount() {
  }

  componentDidMount() {

    let vw = this.props.width/2;
    document.documentElement.style.setProperty('--vw', `${vw}px`);
    document.documentElement.style.setProperty('--vh', `220px`);
    document.querySelector(".graphContainer").addEventListener( 'mouseup', this.onMouseUp, false );

    this.setState({
      data: [],
       dataSymbols: [],
        count: 0,
         siphonSymbols: ["aapl"] });



  }

  componentWillUnmount() {
  }

  onMouseUp(event) {
       this.siphon(this.state.dataSymbols.length);
  }

  siphon(index) {
    console.log(this.state.siphonSymbols[index]);
    let symbol = this.state.siphonSymbols[index];
    if (symbol === "" || !symbol) {
    }else{
      fetch('/api/david/v0.00.00/stock/'+symbol).then(results => {
          return results;
      }).then(data => {
          return data.json();
      }).then(json => {
          let newData = this.state.data;
          newData.push(json);

          let newSymbols = this.state.dataSymbols;
          newSymbols.push(symbol);
          this.setState({data: newData, count: newData.length, dataSymbols: newSymbols});
          console.log(this.state.siphonSymbols.length);
          if (this.state.siphonSymbols.length > newSymbols.length) {
            this.siphon(newSymbols.length);
          }
      });
    }
  }

  render() {

    return (
    <div className="graphContainer">
      <GraphEntity
        data={this.state.count>0 ? this.state.data[0] : {}}
        symbol={this.state.count>0 ? this.state.dataSymbols[0] : ""}
        width={this.props.width/2}/>
      <GraphEntity
        data={this.state.count>1 ? this.state.data[1] : {}}
        symbol={this.state.count>1? this.state.dataSymbols[1] : ""}
        width={this.props.width/2}/>
      <GraphEntity
        data={this.state.count>2 ? this.state.data[2] : {}}
        symbol={this.state.count>2 ? this.state.dataSymbols[2] : ""}
        width={this.props.width/2}/>
    </div>
    )
  }
}

export default Graph;
