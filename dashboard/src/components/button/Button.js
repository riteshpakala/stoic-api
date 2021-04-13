import React from 'react';
import './style.css'
import '../../constants/GlobalStyle.css';

class Disclaimer extends React.Component {
  constructor(props) {
    super(props);


    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
  }

  componentDidMount() {

  	document.querySelector("#button").addEventListener( 'touchend', this.onTouchEnd, false );
    document.querySelector("#button").addEventListener( 'mouseup', this.onMouseUp, false );
  }

  componentWillUnmount() {
      document.querySelector("#button").removeEventListener("touchend", this.onTouchEnd, false);
      document.querySelector("#button").removeEventListener("mouseup", this.onMouseUp, false);
  }

  onMouseUp( event ) {
    this.props.clickController(event);
    event.preventDefault();
  }

  onTouchEnd( event ) {
    this.props.clickController(event);
		event.preventDefault();
  }


  render() {
    return (
      <div>
        <div id="button" className={this.props.isPlaying ? 'basicButton courierSmall stoicBlack' : 'hide'}>
          <p>stop</p>
        </div>
      </div>
    )
  }
}


export default Disclaimer;
