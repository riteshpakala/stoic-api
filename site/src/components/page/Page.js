import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import './style.css';
import '../../constants/GlobalStyle.css';

class Page extends React.Component {

  constructor(props) {
    super(props);

    this.handleScroll = this.handleScroll.bind(this);
    this.videoRef = React.createRef();
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.closeSocials = this.closeSocials.bind(this);
    this.calculateVH = this.calculateVH.bind(this);
    this.advancePage = this.advancePage.bind(this);
    this.scrollPage = this.scrollPage.bind(this);
    this.handleLoadedData = this.handleLoadedData.bind(this);
    this.state = { refresh: 0, scrolled_percent: 0.0, scrollTop: 0.0, reachedTop: false, cardIdx: 0, markerPosY: 0, online: 0, error_precision: "0%" };
  }

  componentWillMount() {
    this.calculateVH();
  }
  componentDidMount() {
      window.addEventListener('scroll', this.handleScroll, true);
      window.addEventListener('touchmove', this.onTouchMove, true);
      window.addEventListener('resize', () => {
        // We execute the same script as before
        this.calculateVH();
      });
      this.calculateVH();
      document.querySelector("#learnMoreInfo").addEventListener( 'touchend', this.onTouchEnd, false );
      document.querySelector("#learnMoreInfo").addEventListener( 'mouseup', this.onMouseUp, false );
      document.querySelector("#keepGoing").addEventListener( 'touchend', this.onTouchEnd, false );
      document.querySelector("#keepGoing").addEventListener( 'mouseup', this.onMouseUp, false );
      document.querySelector("#closeStatementButton").addEventListener( 'touchend', this.closeSocials, false );
      document.querySelector("#closeStatementButton").addEventListener( 'mouseup', this.closeSocials, false );

      //TODO: VIDEO is being removed
      // let video = document.querySelector('video');
      // video.addEventListener('loadeddata', this.handleLoadedData);
      // video.play()

      this.setState({markerPosY: (1.2*window.innerHeight)});

      fetch('/api/david/v0.00.00/site').then(results => {
        return results.json();
      }).then(data => {
          this.setState({error_precision:data["error"]});
      });
  }

  componentWillUnmount() {
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('touchmove', this.onTouchMove);
      document.querySelector("#learnMoreInfo").removeEventListener("touchend", this.onTouchEnd, false);
      document.querySelector("#learnMoreInfo").removeEventListener("mouseup", this.onMouseUp, false);
      document.querySelector("#keepGoing").removeEventListener( 'touchend', this.onTouchEnd, false );
      document.querySelector("#keepGoing").removeEventListener( 'mouseup', this.onMouseUp, false );
      document.querySelector("#closeStatementButton").removeEventListener( 'touchend', this.closeSocials, false );
      document.querySelector("#closeStatementButton").removeEventListener( 'mouseup', this.closeSocials, false );
      document.querySelector('video').removeEventListener('loadeddata', handleLoadedData);
  }

  calculateVH() {
    let vh = window.innerHeight;

    document.documentElement.style.setProperty('--vh', `${vh}px`);

    let vw = window.innerWidth;

    document.documentElement.style.setProperty('--vw', `${vw}px`);
  }

  onMouseUp( event ) {
    event.preventDefault();
    // this.scrollTo(document.getElementById('page'), 4, window.innerHeight);

    this.advancePage();

    document.getElementById('ghostMarker').scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }

  onTouchEnd( event ) {
		event.preventDefault();

    this.advancePage();
    document.getElementById('ghostMarker').scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }

  closeSocials( event ) {
    document.querySelector("#closingStatementsContainer").classList.remove('prepareClosingStatement');
    document.querySelector("#closingStatementsContainer").classList.add('hide');

    if(this.state.cardIdx == 9) {

      this.setState({
           markerPosY: -1*(window.innerHeight) });

       document.getElementById('ghostMarker').scrollIntoView({
         behavior: 'smooth',
         block: 'end',
       });
    }
  }

  onTouchMove( event ) {
    this.scrollPage();
  }

  handleScroll(event){
    this.scrollPage();
  }

  handleForm() {
    document.querySelector("#closingStatementsContainer").classList.remove('prepareClosingStatement');
    document.querySelector("#closingStatementsContainer").classList.add('hide');

    if(this.state.cardIdx == 9) {

      this.setState({
           markerPosY: -1*(window.innerHeight) });

       document.getElementById('ghostMarker').scrollIntoView({
         behavior: 'smooth',
         block: 'end',
       });
    }
  }

  handleLoadedData(event) {
    this.setState({refresh: 1});
    // this.videoRef.current.pause();
  }

  scrollPage() {
    let el = document.getElementById('pageContainer');
    let minPixel = el.offsetTop;
    let maxPixel = minPixel + el.scrollHeight;
    let value = document.body.scrollTop;

    // respect bounds of element
    let percent = (value - minPixel)/(maxPixel - minPixel);
    // console.log(percent);
    //percent = Math.min(1,Math.max(percent, 0));
        // console.log(percent);
    // console.log(percent);

/**

Indexes forthe cards
 1 = 2.4 // Model browser
 2 = 4.0 // forecast window
 3 = 4.6 // sentiment knobs
 4 = 5.8~ // some additional info
 5 = 6.9 // stock characteristics
 6 = 9.1 // forecast further into the future
 7 = 10.5~ //additional info
 8 = 12.0 // closing statements
*/
  let currentCardIdx = 0;

  /*if (percent >= 14.39) {
    document.querySelector("#closingStatementsContainer").classList.remove('hide');
    document.querySelector("#closingStatementsContainer").classList.add('prepareClosingStatement');
    currentCardIdx = 9;//9 is used to end
  } else if (percent >= 12.0) {
    currentCardIdx = 8;
  } else if (percent >= 10.5) {
    currentCardIdx = 7;
  } else*/ if (percent >= 9.1) {
    document.querySelector("#closingStatementsContainer").classList.remove('hide');
    document.querySelector("#closingStatementsContainer").classList.add('prepareClosingStatement');
    currentCardIdx = 6;
  } else if (percent >= 6.9) {
    currentCardIdx = 5;
  } else if (percent >= 5.8) {
    currentCardIdx = 4;
  } else if (percent >= 4.6) {
    currentCardIdx = 3;
  } else if (percent >= 4.0) {
    currentCardIdx = 2;
  } else if (percent >= 2.4) {
    currentCardIdx = 1;
  }

    let newPosYMarker = this.state.markerPosY;
    if (percent <= 1.2) {
      document.querySelector("#closingStatementsContainer").classList.remove('prepareClosingStatement');
      newPosYMarker = ((1.2) * window.innerHeight);
    }

    // this.videoRef.current.currentTime = ((Math.max(0, (percent - 0.6))/15.3)*48.0);

    this.setState({
      scrolled_percent: percent,
       scrollTop: value,
        reachedTop: percent >= 1.2,
         cardIdx: currentCardIdx,
          markerPosY: newPosYMarker});
  }

  advancePage() {
    if (this.state.reachedTop) {
      let currentCardIdx = this.state.cardIdx + 1;
      let percent = this.state.scrolled_percent;
      let newPercent = 1.2;
      let basePosY = (0.2*window.innerHeight);

      /*if (percent >= 12.0) {
        newPercent = 15.3;
      } else if (percent >= 10.5) {
        newPercent = 12.0;
      } else*/ if (percent >= 9.1) {
        newPercent = 10.5;
      } else if (percent >= 6.9) {
        newPercent = 9.1;
      } else if (percent >= 5.8) {
        newPercent = 6.9;
      } else if (percent >= 4.6) {
        newPercent = 5.8;
      } else if (percent >= 4.0) {
        newPercent = 4.6;
      } else if (percent >= 2.4) {
        newPercent = 4.0;
      } else {
        newPercent = 2.4;
      }

      let newPosY = ((newPercent) * window.innerHeight);
      this.setState({
           markerPosY: newPosY });
    }
  }

  render() {
    let images = ["https://stoic-static-files.s3-us-west-1.amazonaws.com/stoic_logo_round.png",
  "https://stoic-static-files.s3-us-west-1.amazonaws.com/site/2021-02-XX/1.png",
  "https://stoic-static-files.s3-us-west-1.amazonaws.com/site/2021-02-XX/2.png",
  "https://stoic-static-files.s3-us-west-1.amazonaws.com/site/2021-02-XX/3.png",
  "https://stoic-static-files.s3-us-west-1.amazonaws.com/site/2021-02-XX/4.png",
  "https://stoic-static-files.s3-us-west-1.amazonaws.com/site/2021-02-XX/5.png",
  "https://stoic-static-files.s3-us-west-1.amazonaws.com/site/2021-02-XX/6.png"];

    return (
    <div id="pageContainer" className="pageContainer">

      <div id="closingStatementsContainer" className="closingStatementsContainer hide"
       style={ {
         opacity : this.state.scrolled_percent - 12.39,//14.39,
        } }>
        <div className="yetiTable">
          <div className="leftColYeti">
              <div className="yetiContainer">
                <a target="_blank" href="https://discord.gg/VFfE8PT"><img style={{width:62}} src="./assets/images/item1.svg" /></a>
              </div>
              <div className="yetiContainer">
                <a target="_blank" href="https://twitter.com/stoic_nyc"><img src="./assets/images/item3.svg" /></a>
              </div>
          </div>
          <div className="rightColYeti">
              <div className="yetiContainer">
                <a target="_blank" href="https://instagram.com/stoic.nyc"><img style={{width:42}} src="./assets/images/item2.svg" /></a>
              </div>
              <div className="yetiContainer">
                <a  target="_blank" href="https://twitch.tv/stoic_nyc"><img style={{width:36}} src="./assets/images/item0.svg" /></a>
              </div>
          </div>
        </div>
        <div className="emailContainer">
          <p> Newsletter //</p><p> "an understanding" </p>
          <form action="https://producthunt.us20.list-manage.com/subscribe/post" method="post" className="validate" onSubmit={() => this.handleForm()} target="hiddenFrame" >

               <input type="hidden" name="u" value="7b26c6228bf2b6017f249119b" />
               <input type="hidden" name="id" value="e13748973c" />
               <input type="hidden" name="ht" value="a36205bec560b2a2480401b84b68952ffd1a4e2b:MTYwNzYyNjIwMi4zMjk4" />
               <input type="hidden" name="c" value="?" />
               <input className="emailInput" type="email" autoCapitalize="off" autoCorrect="off" name="MERGE0" id="MERGE0" size="25" />
               <input className="submitButton" type="submit" name="submit" value="Subscribe" />
         </form>
         <iframe name="hiddenFrame" src="about:blank" style={{display:'none'}}></iframe>
        </div>

          <div id="closeStatementContainer" className="closeStatementContainer">
            <div id="closeStatementButton" className="closeStatementButton">
              <p> X </p>
            </div>
          </div>
      </div>

        <div className="pageContainerDummy" style={{backgroundColor: `rgba(18, 18, 18, ${Math.min(0.75, this.state.scrolled_percent)})`}}>
        </div>
        <div id="page" className= {this.state.reachedTop ? 'page pageUpdateColor' : 'page'} style={{backgroundColor: `rgba(128, 128, 128, ${0.2 - (this.state.scrolled_percent*0.2)})`}}>
          <div id="learnMore" className="learnMore" style={ { opacity : Math.max(0.0, 0.75 - this.state.scrolled_percent)} }>
          <div id="assetBadges" style= { {opacity : '0.0'} }> <a target="_blank" href="https://apps.apple.com/us/app/stoic-market-prediction/id1527885233"><img className = "appStoreBadgeDesktop appStoreBadgeMobile" src="./assets/images/app_store.svg" /></a></div>
          <div id="learnMoreInfo" className="learnMoreInfoDesktop learnMoreInfoMobile"> <p> Get </p></div>
            {/* <div id="learnMoreInfo" className="learnMoreInfoDesktop learnMoreInfoMobile"> <p> Learn <span className="shrinkLearnMore"> More </span> </p></div> */}                               
            <div id="onlineTraders" className="onlineTradersDesktop onlineTradersMobile"> <div className="indicatorOnlineContainer"><div id="indicatorOnline"></div> <p className="indicatorSubtext">latest beta ver.</p> </div> <p className="indicatorText">{this.state.error_precision}<span className="indicatorSlashes"> // </span> </p>  </div>
          </div>

          {/* <div
            className= { this.state.refresh == 0 ? "" : "videoAsset videoAssetAnimInDesktop videoAssetAnimInTablet videoAssetAnimInMobile videoAssetAnimInMobile2" }
            style={ {
              opacity : this.state.scrolled_percent - 0.5 ,
               left: `${(1.0 - Math.min(0.5, this.state.scrolled_percent - 0.5))*100}%` ,
                top : `${ (0.5 - (1.0-(14.8 - Math.max(13.8, this.state.scrolled_percent))))*100}%`, } }>
              <video
                id="stoicIntroVideo"
                tabIndex="0"
                autobuffer="autobuffer"
                preload="preload"
                className="videoStyle videoStyleMobile videoStyleMobile2 videoStyleMobile3"
                muted
                playsInline
                ref={this.videoRef}
              >
                <source type="video/mp4" src="./assets/videos/app_walkthrough_scaled.mp4" />
              </video>
          </div> */}

          <div
            className= { "imageAsset videoAssetAnimInDesktop videoAssetAnimInTablet videoAssetAnimInMobile videoAssetAnimInMobile2" }
            style={ {
              opacity : this.state.scrolled_percent - 0.5 ,
               left: `${(1.0 - Math.min(0.5, this.state.scrolled_percent - 0.5))*100}%` ,
                top : `${ (0.5 - (1.0-(/*14.8*/12.8 - Math.max(/*13.8*/11.8, this.state.scrolled_percent))))*100}%`, } }>
              <img
                id="stoicIntroVideo"
                className="videoStyle videoStyleMobile videoStyleMobile2 videoStyleMobile3"
                src= { images[this.state.cardIdx] } />
          </div> 



            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
             style={ {
               left: `${Math.min(0.5, this.state.scrolled_percent - 0.5)*100}%`,
                 opacity : this.state.scrolled_percent - 0.5,
                 display: this.state.cardIdx == 0 ? 'block' : 'none'
               } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      * 0.0 - beta
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p><a href="https://stoic-static-files.s3-us-west-1.amazonaws.com/builds/latest/*+stoic.zip">macOS</a> <span className="infoSmallerText">// big sur, v11.0 or later</span></p>
                      <p><a href="https://testflight.apple.com/join/tlNifTQZ">iPhone & iPad</a> <span className="infoSmallerText">// v13.0 or later</span></p>
                  </div>

                </div>
            </div>

            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
             style={ {
                 opacity : this.state.scrolled_percent - 0.5,
                 display: this.state.cardIdx == 1 ? 'block' : 'none'
               } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      * about
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p>The next phase of * stoic is to share tools reserved for a select few.</p>
                  </div>

                </div>
            </div>

            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
             style={ {
                 opacity : this.state.scrolled_percent - 0.5,
                 display: this.state.cardIdx == 2 ? 'block' : 'none'
               } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      * why
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p>Trading is & becoming more accessible; Healthier attitudes and outlooks on trading securities is imperative.</p>
                  </div>

                </div>
            </div>

            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
             style={ {
                 opacity : this.state.scrolled_percent - 0.5,
                 display: this.state.cardIdx == 3 ? 'block' : 'none'
               } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      * how
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p>This platform seeks to develop a strategic mind. With new-age indicators powered by, * stoic's tonal interface.</p>
                  </div>

                </div>
            </div>

            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
             style={ {
                 opacity : this.state.scrolled_percent - 0.5,
                 display: this.state.cardIdx == 4 ? 'block' : 'none'
               } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      * where
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p>To create an intuitive security viewing experience.</p>
                  </div>

                </div>
            </div>

            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
             style={ {
                 opacity : this.state.scrolled_percent - 0.5,
                 display: this.state.cardIdx == 5 ? 'block' : 'none'
               } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      * discuss
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p> To build a community of traders, from all demographics. </p>
                  </div>

                </div>
            </div>

            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
            //  style={ {
            //      opacity : this.state.scrolled_percent - 0.5,
            //      display: this.state.cardIdx == 6 ? 'block' : 'none'
            //    } }>
            style={ {
              // 14.0-13.0  => 0 -> 1 // negate < 13.0
                top : `${ (0.5 - (1.0-(/*14.5*/12.5 - Math.max(/*13.5*/11.5, this.state.scrolled_percent))))*100}%`,
                opacity : this.state.scrolled_percent - 0.5,
                display: this.state.cardIdx == 6 ? 'block' : 'none'
              } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      * stoic
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p>Wrapped into a package that can see the stocks & cryptocurrencies all in one place.</p>
                  </div>

                </div>
            </div>

            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
             style={ {
                 opacity : this.state.scrolled_percent - 0.5,
                 display: this.state.cardIdx == 7 ? 'block' : 'none'
               } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      8. Accuracy
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p>Institutional research has averaged 60% accuracy with only time series relevancy. </p>
                      <p>Sentiment analysis can fill the gaps. To analyze the variable of prejudice is the challenge.</p>
                  </div>

                </div>
            </div>

            <div
             className="infoContainer infoAnimInDesktop infoAnimInTablet infoAnimInMobile infoAnimInMobile2 infoContainerMobile infoContainerDesktop"
             style={ {
               // 14.0-13.0  => 0 -> 1 // negate < 13.0
                 top : `${ (0.5 - (1.0-(/*14.5*/9.3 - Math.max(/*13.5*/8.4, this.state.scrolled_percent))))*100}%`,
                 opacity : this.state.scrolled_percent - 0.5,
                 display: this.state.cardIdx == 8 ? 'block' : 'none'
               } }>
                <div className="text">

                  <div className="title titleDesktop titleMobile titleMobile2">
                      9. Security
                  </div>

                  <div className="info infoDesktop infoMobile infoMobile2">
                      <p>Your model is never uploaded.</p>
                      <p>Your personal data is never recorded.</p>
                      <p>Your time is never wasted.</p>
                      <p>Your financial health is the upmost importance.</p>
                  </div>

                </div>
            </div>


            <div id="ghostMarker" className="ghostMarker" style={ {
                marginTop : this.state.markerPosY
              } }> </div>

            <div
            id="keepGoing"
            className={this.state.scrolled_percent > 0.25 ? "keepGoing" : "keepGoingResting"}
            style={ {
              opacity :
               `${ Math.min(1.0, this.state.scrolled_percent*2) }` } }>
              <img src="./assets/images/down_arrow.png"></img>
            </div>

            <div
             className="scrollProgressIndicator"
             style={ {
               opacity : this.state.scrolled_percent - 0.5,
               width: `${(Math.min(16.0, this.state.scrolled_percent)/16.0)*100}%` } }>

            </div>

          </div>
    </div>
    )
  }
}

export default Page;
