import React from 'react';
import './style.css'
import ReactPlayer from 'react-player/youtube'

class Sound extends React.Component {
  constructor(props) {
    super(props);

    this.state = {animate: true, isLandscape: true, headerClass: 'hide'};
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this.forceUpdate();
  }

  componentWillMount() {
      this.forceUpdate();
  }

  componentWillUnmount() {
      window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
      this.forceUpdate();
  };

  forceUpdate() {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const isLandscape = containerWidth > containerHeight;
    const toBeHeaderClass = isLandscape ? 'soundContainerLandscape fade-in-sound' : 'soundContainer fade-in-sound';
    
    this.setState({
        isLandscape: isLandscape,
        headerClass: toBeHeaderClass
    });
  }

  render() {
    return (
      <div className= {this.props.isPlaying ? this.state.headerClass : 'hide'}>
        <ReactPlayer
        playing={this.props.isPlaying}
        volume={this.props.setVolume}
        url='https://www.youtube.com/playlist?list=PLT8Ntr0AnvJIz99NswgVkVZfylga_qb62'
        width='100%'
        height='100%'/>
      </div>
    )
  }
}


export default Sound;

/***
https://www.youtube.com/watch?v=MYePxxX8AM4&list=PLT8Ntr0AnvJIz99NswgVkVZfylga_qb62&ab_channel=rumworld

auto_play	true/false	Start playing the item automatically
color	hex code	Color play button and other controls. e.g. “#0066CC”
buying	true/false	Show/Hide buy buttons
sharing	true/false	Show/Hide share buttons
download	true/false	Show/Hide download buttons
show_artwork	true/false	Show/Hide the item’s artwork
show_playcount	true/false	Show/Hide number of track plays
show_user	true/false	Show/Hide the uploader name
start_track	number	A number from 0 to the playlist length which reselects the track in a playlist
single_active	true/false	If set to false the multiple players on the page won’t toggle each other off when playing


soundcloud:
<ReactPlayer
        playing={this.props.isPlaying}
        volume={this.props.setVolume}
        url='https://soundcloud.com/linenandsole/sets/stoic'
        config={{
            soundcloud: {
              playerVars: {
                buying: false,
                sharing: false,
                download: false,
                show_artwork: false,
                show_playcount: false,
                show_user: false,
              }
            },
          }}/>

**/
