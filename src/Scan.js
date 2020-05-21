import React from "react";
import QrReader from "react-qr-reader";
import LoadingOverlay from "react-loading-overlay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Timer from "./Timer";
import { CopyButton } from "./CopyButton";
export class Scan extends React.Component {
  timer = new Timer({ count: 600 });
  state = {
    result: null,
    isLoading: false,
    shouldDisplayResult: false,
    countingDown: true,
    countdown: 600,
  };
  componentDidMount() {
    this.timer.tick = (count) => {
      this.setState({
        countdown: count,
      });
    };
    this.timer.end = () => {
      this.handleGoBack();
    };
    if (navigator.getUserMedia) {
      navigator.getUserMedia({
        video: true,
      }, function (localMediaStream) { }, function (err) {
        alert("The following error occurred when trying to access the camera: " +
          err);
      });
    }
    else {
      alert("Sorry, browser does not support camera access. If you are on iOS, please use Safari.");
    }
  }
  handleDisplayResults = () => {
    setTimeout(() => {
      try {
        const e = JSON.parse(atob(this.state.result));
        if (e.event === 'qarr-join-chat') {
          return window.location.replace(window.location.origin + `/send?data=${this.state.result}`)
        }
      }
      catch(e) {

      }
      this.setState({
        shouldDisplayResult: true,
        isLoading: false,
      });
    }, 1000);
  };
  handleScan = (data) => {
    if (data) {
      
      this.timer.start();
      this.setState({
        result: data,
        isLoading: true,
      }, this.handleDisplayResults);
    }
  };
  handleError = (err) => {
    console.error(err);
  };
  handleGoBack = () => {
    this.timer.clear();
    this.setState({
      result: null,
      shouldDisplayResult: false,
      countdown: 600,
    });
  };
  resetCountdown = () => {
    this.timer.reset();
    this.setState({
      countdown: 600
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
    if (this.state.shouldDisplayResult) {
      return (<div className="columns is-mobile is-centered is-vcentered">
        <div className="column is-12">
          <div className="notification is-success is-light" style={{ backgroundColor: "#75776354" }}>
            <pre id="result" className="html" style={{ width: "100%", display: "inline-block" }}>
              {this.state.result}
            </pre>
            <br />
            <div onClick={this.stopOrResumeCountdown}>{this.state.countdown}</div>
            <CopyButton target="#result" />
            <button className="button" onClick={this.handleGoBack}>
              <span className="icon is-small">
                <FontAwesomeIcon icon={faArrowLeft} />
              </span>
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>);
    }
    const size = document.documentElement.clientWidth <= 500 ? 256 : 768;
    return (<div className="container is-fluid">
      <div style={{
        width: size + "px",
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        <LoadingOverlay active={this.state.isLoading} spinner>
          <QrReader delay={100} showViewFinder={true} onError={this.handleError} onScan={this.handleScan} style={{ width: "100%" }} />
        </LoadingOverlay>
      </div>
    </div>);
  }
}
