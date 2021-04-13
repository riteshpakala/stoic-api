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
    let symbols = [this.props.symbol];
    this.setState({
      data: [],
       dataSymbols: [],
        count: 0,
         siphonSymbols: symbols });
  }

  componentDidMount() {

    let vw = (this.props.width/3) - 16;
    document.documentElement.style.setProperty('--vw', `${vw}px`);
    document.documentElement.style.setProperty('--vh', `220px`);
    document.querySelector(".graphContainer").addEventListener( 'mouseup', this.onMouseUp, false );



    for (const symbol in this.state.siphonSymbols) {
      this.siphon(this.state.siphonSymbols[symbol]);
    }

  }

  componentWillUnmount() {
  }

  onMouseUp(event) {
  }

  siphon(symbol) {
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
      });
    }
  }

  render() {
      if(this.state.data.length === this.state.siphonSymbols.length) {

        return (<div className="graphContainer">
          <GraphEntity
            data={this.state.data[0]}
            symbol={this.state.dataSymbols[0]}
            width={this.props.width/3}/>
          </div>)

      } else {
        return (<div className="graphContainer"> hey </div>);
      }
  }
}

export default Graph;
