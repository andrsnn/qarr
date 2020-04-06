import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./App.sass";

import QrReader from "react-qr-reader";
import LoadingOverlay from "react-loading-overlay";

import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faArrowLeft,
  faDownload
} from "@fortawesome/free-solid-svg-icons";

import logo from "./logo.svg";

var QRCode = require("qrcode");

const ClipboardJS = require("clipboard");

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
  state = {
    result: null,
    isLoading: false,
    shouldDisplayResult: false,
  };

  componentDidMount() {
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
    this.setState({
      result: null,
      shouldDisplayResult: false,
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
        console.log("success!");
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
          style={{ width: "128px", height: "128px" }}
        ></canvas>
      </div>
    );
  }
}

class Create extends React.Component {
  state = {
    text: "Type to create...",
  };
  handleOnChange = (e) => {
    this.setState({
      text: e.target.value,
    });
  };
  handleDownload = () => {
    // should be doing this within react + encapsulated within the component...
    var canvas = document.getElementById("canvas");
    var link = document.getElementById('link');
    link.setAttribute('download', 'download.png');
    link.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
    link.click();
  }
  render() {
    return (
      <div className="columns is-mobile is-centered is-vcentered">
        <div className="column is-12">
          <div
            className="notification is-success is-light"
            style={{ backgroundColor: "#75776354" }}
          >
            <div style={{ textAlign: "center" }}>
              <QRCodeComp value={this.state.text} />
            </div>

            <br />
            <a id="link" style={{display: 'none'}}></a>
            <div className="field">
              <div className="control">
                <textarea
                  onChange={this.handleOnChange}
                  style={{ color: "black", borderColor: "#757763" }}
                  className="textarea is-success"
                  placeholder="Type to create..."
                  value={this.state.value}
                ></textarea>
              </div>
            </div>
            <button
              className="button"
            >
              <span className="icon is-small">
                <FontAwesomeIcon icon={faDownload} />
              </span>
              <span onClick={this.handleDownload}>Download</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
