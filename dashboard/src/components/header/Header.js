import React from 'react';
import PropTypes from 'prop-types';
import './style.css';
import '../../constants/GlobalStyle.css';

class Header extends React.Component {
  constructor(props) {
    super(props);

    this.state = {animate: true, todaysDate: ""};
  }

  componentDidMount() {
    let today = new Date();
    let dd = 15;// today.getDate()+(this.props.isReady ? 1 : 0);
    let mm = today.getMonth()+1;
    let yyyy = today.getFullYear();
    let date = yyyy+'-'+mm+'-'+dd;
    if(window.sessionStorage.getItem("firstLoadDone") === null) {
      this.setState({
        animate: true,
        todaysDate: date
      })

      window.sessionStorage.setItem("firstLoadDone", 1);
    } else {
      this.setState({
        animate: false,
        todaysDate: date
      })
    }
  }

  render() {
    return (
    <div>
        <div className="header">
            <div className="headerTitleContainer marginLeftPadding">
                <p className="courierLarge fade-in-copy-2">
                    <a className="stoicMarbleBrown" target="_blank" href={this.props.titleLink}>{this.props.title}</a>
                </p>
            </div>

            <div className="modelType courierSemiLarge stoicPurple"> <span> predicting: close // { this.state.todaysDate }</span> </div>

            <div className="headerDetailsContainer marginRightPadding">
              <p className="courierSemiLarge fade-in-copy-2">
                  <a className="stoicOrange" >{this.props.subtitle}</a>
              </p>
            </div>

        </div>
    </div>
    )
  }
}

Header.propTypes ={
    title:PropTypes.string.isRequired,
    titleLink:PropTypes.string.isRequired,
    subtitle:PropTypes.string.isRequired,
    detail1:PropTypes.string.isRequired,
    detail1Link:PropTypes.string.isRequired,
    detail2:PropTypes.string.isRequired,
    detail2Link:PropTypes.string.isRequired,
}

Header.defaultProps = {
    title: '* stoic',
    titleLink: 'https://apps.apple.com/us/app/stoic-market-prediction/id1527885233',
    subtitle: 'engine: david.v00.01.10',
    detail1: 'email',
    detail1Link: 'mailto:team@linenandsole.com',
    detail2: 'discord',
    detail2Link: 'https://discord.gg/VFfE8PT',
};

export default Header;
