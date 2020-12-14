import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './style.css';
import '../../constants/GlobalStyle.css';

import Graph from '../graph/Graph';

class TheView extends React.Component {

  constructor(props) {
    super(props);
  }

  componentWillMount() {

  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {

    return (
    <div className="theViewContainer">
      <div className="graphsToTheLeft">
        <Graph
          symbol="aapl"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
        <Graph
          symbol="msft"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
        <Graph
          symbol="amzn"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
      </div>

      <div className="graphsToTheRight">

        <Graph
          symbol="tsla"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
        <Graph
          symbol="goog"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
        <Graph
          symbol="fb"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
      </div>

      <div className="graphsToTheRight">

        <Graph
          symbol="mrna"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
        <Graph
          symbol="nvda"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
        <Graph
          symbol="amd"
          count={4}
          width={window.innerWidth*this.props.widthRatio}/>
      </div>

      </div>
    )
  }
}

export default TheView;
