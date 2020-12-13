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
      <Graph
        count={4}
        width={window.innerWidth*this.props.widthRatio}/>
    </div>
    )
  }
}

export default TheView;
