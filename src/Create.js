/* eslint-disable jsx-a11y/anchor-has-content */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faWifi, faDice } from "@fortawesome/free-solid-svg-icons";
import Timer from "./Timer";
import { QRCodeComp } from "./QRCodeComp";
import { Modal } from "./Modal";
import { password } from "./App";
export class Create extends React.Component {
  timer = new Timer({ count: 600 });
  state = {
    text: "",
    countdown: 600,
    countingDown: true,
    displayWifiModal: false
  };
  componentDidMount() {
    this.timer.tick = (count) => {
      this.setState({
        countdown: count,
      });
    };
    this.timer.end = () => {
      this.setState({
        text: "",
        countdown: 600,
      });
    };
  }
  componentWillUnmount() {
    this.timer.clear();
  }
  handleOnChange = (e) => {
    this.setState({
      text: e.target.value,
      countdown: 600,
    }, () => {
      this.timer.start();
      this.timer.reset();
    });
  };
  handleDownload = () => {
    // should be doing this within react + encapsulated within the component...
    var canvas = document.getElementById("canvas");
    var link = document.getElementById("link");
    link.setAttribute("download", "download.png");
    link.setAttribute("href", canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
    link.click();
  };
  handleOpenWifi = () => {
    this.timer.pause();
    this.setState({
      displayWifiModal: true
    });
  };
  handleWifiDone = ({ name, password, hidden }) => {
    const wifiStr = `WIFI:T:WPA;S:${name};P:${password};${hidden ? 'true' : ''};`;
    this.setState({
      text: wifiStr,
      countdown: 600,
      displayWifiModal: false
    }, () => {
      this.timer.start();
      this.timer.reset();
    });
  };
  handleCloseWifi = () => {
    this.timer.resume();
    this.setState({
      displayWifiModal: false
    });
  };
  handleRandom = () => {
    var rnd = password.generate(32);
    this.setState({
      text: rnd,
      countdown: 600
    }, () => {
      this.timer.start();
      this.timer.reset();
    });
  };
  stopOrResumeCountdown = () => {
    if (!this.state.countingDown) {
      this.timer.reset();
      this.timer.start();
      this.setState({
        countdown: 600,
        countingDown: true
      });
    }
    else {
      this.timer.reset();
      this.timer.pause();
      this.setState({
        countdown: 600,
        countingDown: false
      });
    }

  };
  render() {
    return (<div className="columns is-mobile is-centered is-vcentered">
      {this.state.displayWifiModal && <Modal onSave={this.handleWifiDone} onCancel={this.handleCloseWifi} />}
      <div className="column is-12">
        <div className="notification is-success is-light" style={{ backgroundColor: "#75776354" }}>
          <div style={{ textAlign: "center" }}>
            <QRCodeComp value={this.state.text || 'Type to create...'} />
          </div>

          <br />
          <a id="link" style={{ display: "none" }}></a>
          <div className="field">
            <div className="control">
              <textarea onChange={this.handleOnChange} style={{ color: "black", borderColor: "#757763" }} className="textarea is-success" placeholder="Type to create..." value={this.state.text}></textarea>
              <div onClick={this.stopOrResumeCountdown}>{this.state.countdown}</div>
            </div>
          </div>
          <button onClick={this.handleDownload} className="button">
            <span className="icon is-small">
              <FontAwesomeIcon icon={faDownload} />
            </span>
            <span>Download</span>
          </button>
          <button onClick={this.handleOpenWifi} className="button" style={{ marginLeft: '10px' }}>
            <span className="icon is-small">
              <FontAwesomeIcon icon={faWifi} />
            </span>
          </button>
          <button onClick={this.handleRandom} className="button">
            <span className="icon is-small">
              <FontAwesomeIcon icon={faDice} />
            </span>
          </button>
        </div>
      </div>
    </div>);
  }
}
