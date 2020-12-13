import React from 'react';
import './style.css'
import Header from '../components/header/Header';
import Prediction from '../components/prediction/Prediction';
import Model from '../components/model/Model';
import Sound from '../components/sound/Sound';
import Button from '../components/button/Button';
import Graph from '../components/graph/Graph';
import TheView from '../components/theView/theView';

export const CLICK_CONTROL = {
    TOUCHSTART: "touchstart",
    TOUCHEND: "touchend",
    MOUSEUP: "mouseup",
    MOUSEDOWN: "mousedown",
    WHEEL: "wheel"
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.clickController = this.clickController.bind(this);
    this.state = {playing: false, volume: 0.75, showPrediction: false};
  }

  //Fetch the user data, if a valid username is detected.
  //
  componentDidMount() {
    let url = window.location.href;
    let viewIndex = url.lastIndexOf('/');
    if (url.substring(viewIndex+1).toLowerCase() == "think") {
      this.setState({showPrediction: true});
    }
  }

  clickController(e) {

    var isCanvas = e.target.localName == "canvas";

    if (e.type == CLICK_CONTROL.MOUSEUP) {
        this.setState({playing: (this.state.playing && !isCanvas) ? false : true, volume: 0.75});
    } else if (e.type == CLICK_CONTROL.TOUCHEND) {
        this.setState({playing: (this.state.playing && !isCanvas) ? false : true, volume: 0.75});
    }
  }

  render() {
    const shouldShowPrediction = this.state.showPrediction;
    let prediction;
    if (shouldShowPrediction) {
      prediction = <Prediction />;
    }

    return (
      <div className="appContainer">
        <div className="appMedia">
          {<Header />}
          {prediction}
          {<Model clickController={this.clickController} />}
          {<Sound isPlaying={this.state.playing} setVolume={this.state.volume} />}
        </div>

        { <TheView size={4} widthRatio={0.8} /> }


        {<Button isPlaying={this.state.playing} clickController={this.clickController} />}

      </div>
    )
  }
}


export default App;


/* <iframe className="discord" src="https://discordapp.com/widget?id=755220474753056898&theme=dark" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe> */
