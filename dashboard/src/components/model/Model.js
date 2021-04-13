import React from 'react';
import './style.css'
import icon from "../../res/StoicAppIcon2v2.png";
import {BrowserView, MobileView, isTablet, isBrowser} from 'react-device-detect';

import ModelViewer from './engine/ModelViewer';

class Model extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
            aspectRatio: "56.125%", forceRender: 0};

    this.handleResize = this.handleResize.bind(this);
    this.forceUpdate = this.forceUpdate.bind(this);
  }

  componentDidMount() {
      // window.addEventListener('resize', this.handleResize);
      // this.forceUpdate();

  }

  componentWillMount() {
      // this.forceUpdate();
  }

  componentWillUnmount() {
      // window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
      this.forceUpdate();
  };

  forceUpdate() {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    const currentCycle = this.state.forceRender;
    // this.setState({
    //     aspectRatio: ((containerHeight/containerWidth)*100).toString()+"%",
    //     forceRender: currentCycle+1,
    // });
  }



  render() {

    const browserModelView = () => {
      if(!isTablet && isBrowser) {
        return (<BrowserView viewClassName= "mustAppear">
          <ModelViewer
          url="./alexander.stl"
          width="100%"
          color="#B4A59D"
          aspectRatio={this.state.aspectRatio}
          backgroundColor='#000000'
          rotationSpeeds={[0.0000,0.000,-0.0012]}
          initControlPosition={[-0.07,-2.4,1.2]}
          clickController={this.props.clickController}></ModelViewer>
        </BrowserView>);
      }
    }
    return (
      <div className="modelContainer">
        <div className="model">
          <div className= "fade-in-model" >

            { browserModelView() }

            <MobileView viewClassName= "mustAppear">
              <ModelViewer
              key={this.state.forceRender}
              url="./alexander.stl"
              width="100%"
              color="#B4A59D"
              aspectRatio={this.state.aspectRatio}
              backgroundColor='#000000'
              rotationSpeeds={[0.0000,0.000,-0.0012]}
              initControlPosition={[-0.07,-2.4,1.6]}
              clickController={this.props.clickController}></ModelViewer>
            </MobileView>
          </div>
        </div>
      </div>
    )
  }
}


export default Model;
