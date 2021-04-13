import React from 'react';
import ReactDOM from 'react-dom';
import Favicon from 'react-favicon';
import App from './controllers/App';
import './style.css'

ReactDOM.render(
  <div>
    <Favicon url="./res/favicon.ico"/>
    
    <App />
  </div>,
  document.getElementById('app')
);

module.hot.accept();