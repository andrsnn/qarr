import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./App.sass";
import "./App.css";

import QrReader from "react-qr-reader";
import LoadingOverlay from "react-loading-overlay";

import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faArrowLeft,
  faDownload,
  faWifi,
  faDice
} from "@fortawesome/free-solid-svg-icons";

import Timer from "./Timer";
import Password from './password';

import logo from "./logo.svg";

const QRCode = require("qrcode");

const ClipboardJS = require("clipboard");
const password = new Password();

export default class Root extends React.Component {
  state = {
    isBurgerExtended: false,
  };
  handleBurgerClick = (e) => {
    this.setState({
      isBurgerExtended: !this.state.isBurgerExtended,
    });
  };
  render() {
    let burgerClassName = "navbar-burger burger";

    if (this.state.isBurgerExtended) {
      burgerClassName += " is-active";
    }

    return (
      <Router>
        <nav className="navbar" role="navigation" aria-label="main navigation">
          <div className="navbar-brand">
            <a className="navbar-item" href="https://github.com/andrsnn/qarr">
              <span style={{ display: "none" }}>
                Icons made by
                <a
                  href="https://www.flaticon.com/authors/good-ware"
                  title="Good Ware"
                >
                  Good Ware
                </a>
                from
                <a href="https://www.flaticon.com/" title="Flaticon">
                  www.flaticon.com
                </a>
              </span>
              <img src={logo} style={{ maxHeight: "4rem" }} />
              <span
                style={{
                  fontFamily: "'Pacifico', cursive",
                  marginLeft: ".25rem",
                  fontSize: "2.75rem",
                }}
              >
                Q Arr
              </span>
            </a>

            <a
              role="button"
              className={burgerClassName}
              aria-label="menu"
              aria-expanded={this.state.isBurgerExtended ? "true" : "false"}
              data-target="navbarBasicExample"
            >
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a>
          </div>

          <div
            id="navbarBasicExample"
            className="navbar-menu"
            style={{ display: "flex" }}
          >
            <div className="navbar-start">
              <a className="navbar-item" href="/create">
                Create
              </a>
              <a className="navbar-item" href="/scan">
                Scan
              </a>
            </div>
          </div>
        </nav>

        <Switch>
          <Route exact path="/">
            <Section>
              <Create />
            </Section>
          </Route>
          <Route exact path="/scan">
            <Section>
              <Scan></Scan>
            </Section>
          </Route>
          <Route path="/create">
            <Section>
              <Create />
            </Section>
          </Route>
        </Switch>
      </Router>
    );
  }
}

// You can think of these components as "pages"
// in your app.

class CopyButton extends React.Component {
  constructor(props) {
    super(props);
    this.triggerCopy = React.createRef();
  }

  componentDidMount() {
    this.clipboard = new ClipboardJS(this.triggerCopy.current);
  }

  componentWillUnmount() {
    this.clipboard.destroy();
  }

  render() {
    return (
      <button
        className="button"
        ref={this.triggerCopy}
        data-clipboard-target={this.props.target}
      >
        <span className="icon is-small">
          <FontAwesomeIcon icon={faCopy} />
        </span>
        <span>Copy</span>
      </button>
    );
  }
}

function Section(props) {
  return (
    <section className="section">
      <div className="container">{props.children}</div>
    </section>
  );
}

class Scan extends React.Component {
  timer = new Timer({ count: 60 });
  state = {
    result: null,
    isLoading: false,
    shouldDisplayResult: false,
    countdown: 60,
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
      navigator.getUserMedia(
        {
          video: true,
        },
        function (localMediaStream) {},
        function (err) {
          alert(
            "The following error occurred when trying to access the camera: " +
              err
          );
        }
      );
    } else {
      alert(
        "Sorry, browser does not support camera access. If you are on iOS, please use Safari."
      );
    }
  }

  handleDisplayResults = () => {
    setTimeout(() => {
      this.setState({
        shouldDisplayResult: true,
        isLoading: false,
      });
    }, 2000);
  };

  handleScan = (data) => {
    if (data) {
      this.timer.start();
      this.setState(
        {
          result: data,
          isLoading: true,
        },
        this.handleDisplayResults
      );
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
      countdown: 60,
    });
  };
  render() {
    if (this.state.shouldDisplayResult) {
      return (
        <div className="columns is-mobile is-centered is-vcentered">
          <div className="column is-12">
            <div
              className="notification is-success is-light"
              style={{ backgroundColor: "#75776354" }}
            >
              <pre
                id="result"
                className="html"
                style={{ width: "100%", display: "inline-block" }}
              >
                {this.state.result}
              </pre>
              <br />
              <div>{this.state.countdown}</div>
              <CopyButton target="#result" />
              <button className="button" onClick={this.handleGoBack}>
                <span className="icon is-small">
                  <FontAwesomeIcon icon={faArrowLeft} />
                </span>
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    const size = window.innerWidth <= 500 ? 256 : 768;
    return (
      <div className="container is-fluid">
        <div
          style={{
            width: size + "px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <LoadingOverlay active={this.state.isLoading} spinner>
            <QrReader
              delay={100}
              showViewFinder={true}
              onError={this.handleError}
              onScan={this.handleScan}
              style={{ width: "100%" }}
            />
          </LoadingOverlay>
        </div>
      </div>
    );
  }
}

class QRCodeComp extends React.Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }

  renderQrCodeToCanvas = () => {
    const scale = window.innerWidth <= 500 ? 5 : 15;
    QRCode.toCanvas(
      this.canvas.current,
      this.props.value || "Type to create...",
      { scale },
      function (error) {
        if (error) console.error(error);
      }
    );
  };

  componentDidMount() {
    this.renderQrCodeToCanvas();
  }

  componentDidUpdate() {
    this.renderQrCodeToCanvas();
  }

  render() {
    return (
      <div>
        <canvas
          id="canvas"
          ref={this.canvas}
          style={{ width: "128px", height: "128px", maxWidth: '375px', maxHeight: '375px' }}
        ></canvas>
      </div>
    );
  }
}

class Modal extends React.Component {
  state = {
    name: '',
    password: '',
    hidden: false
  }
  handleChange = (key, e) => {
    this.setState({
      [key]: e.target.value
    })
  }
  componentDidMount() {
    document.querySelector('html').classList.add('modal-is-open');
  }
  componentWillUnmount() {
    document.querySelector('html').classList.remove('modal-is-open');
  }
  render() {
    return (
      <div className="modal" style={{display: 'block'}}>
      <div className="modal-background"></div>
      <div className="modal-card" style={{marginTop: '20px'}}>
        <header className="modal-card-head">
          <p className="modal-card-title">Create Wifi QR code</p>
          <button className="delete" onClick={this.props.onCancel} aria-label="close"></button>
        </header>
        <section className="modal-card-body">
        <div className="field">
          <label className="label">Name</label>
          <div className="control">
          <input className="input" type="text" placeholder="Enter network name..." onChange={this.handleChange.bind(this, 'name')} value={this.state.name}/>
          </div>
        </div>
        <div className="field">
          <label className="label">Password</label>
          <div className="control">
          <input className="input" type="password" autoComplete="off" placeholder="Enter password..." onChange={this.handleChange.bind(this, 'password')} value={this.state.password}/>
          </div>
        </div>
        <label className="checkbox">
          <input type="checkbox" onChange={this.handleChange.bind(this, 'hidden')} value={this.state.hidden}/>
          <span>  Hidden</span>
        </label>
        </section>
        <footer className="modal-card-foot">
          <button onClick={() => this.props.onSave({
            name: this.state.name,
            password: this.state.password,
            hidden: this.state.hidden
          })} className="button is-success">Done</button>
          <button onClick={this.props.onCancel} className="button">Cancel</button>
        </footer>
      </div>
      </div>
    )
  }
}


class Create extends React.Component {
  timer = new Timer({ count: 60 });
  state = {
    text: "",
    countdown: 60,
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
        countdown: 60,
      });
    };
  }
  componentWillUnmount() {
    this.timer.clear();
  }
  handleOnChange = (e) => {
    this.setState(
      {
        text: e.target.value,
        countdown: 60,
      },
      () => {
        this.timer.start();
        this.timer.reset();
      }
    );
  };
  handleDownload = () => {
    // should be doing this within react + encapsulated within the component...
    var canvas = document.getElementById("canvas");
    var link = document.getElementById("link");
    link.setAttribute("download", "download.png");
    link.setAttribute(
      "href",
      canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
    );
    link.click();
  };
  handleOpenWifi = () => {
    this.timer.pause();
    this.setState({
      displayWifiModal: true
    })
  }
  handleWifiDone = ({name, password, hidden}) => {
    
    const wifiStr = `WIFI:T:WPA;S:${name};P:${password};${hidden ? 'true' : ''};`
    this.setState(
      {
        text: wifiStr,
        countdown: 60,
        displayWifiModal: false
      },
      () => {
        this.timer.start();
        this.timer.reset();
      }
    );
  }
  handleCloseWifi = () => {
    this.timer.resume();
    this.setState({
      displayWifiModal: false
    })
  }
  handleRandom = () => {
    var rnd = password.generate(32);
    this.setState({
      text: rnd,
      countdown: 60
    },
    () => {
      this.timer.start();
      this.timer.reset();
    })
  }
  render() {
    return (
      <div className="columns is-mobile is-centered is-vcentered">
        {this.state.displayWifiModal && <Modal
          onSave={this.handleWifiDone}
          onCancel={this.handleCloseWifi}/>}
        <div className="column is-12">
          <div
            className="notification is-success is-light"
            style={{ backgroundColor: "#75776354" }}
          >
            <div style={{ textAlign: "center" }}>
              <QRCodeComp value={this.state.text} />
            </div>

            <br />
            <a id="link" style={{ display: "none" }}></a>
            <div className="field">
              <div className="control">
                <textarea
                  onChange={this.handleOnChange}
                  style={{ color: "black", borderColor: "#757763" }}
                  className="textarea is-success"
                  placeholder="Type to create..."
                  value={this.state.text}
                ></textarea>
                <div>{this.state.countdown}</div>
              </div>
            </div>
            <button onClick={this.handleDownload} className="button">
              <span className="icon is-small">
                <FontAwesomeIcon icon={faDownload} />
              </span>
              <span >Download</span>
            </button>
            <button  onClick={this.handleOpenWifi} className="button" style={{marginLeft: '10px'}}>
              <span className="icon is-small">
                <FontAwesomeIcon icon={faWifi} />
              </span>
            </button>
            <button  onClick={this.handleRandom} className="button">
              <span className="icon is-small">
                <FontAwesomeIcon icon={faDice} />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
