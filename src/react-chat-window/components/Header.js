import React, { Component } from 'react';
import closeIcon from './../assets/close-icon.png';
import logo from '../../logo.svg';

class Header extends Component {

  render() {
    return (
      <div className="sc-header">
        <img className="sc-header--img" src={logo} alt="" />
        <div className="sc-header--team-name"> {this.props.teamName} </div>
        
      </div>
    );
  }
}

export default Header;
