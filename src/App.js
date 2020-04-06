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
  faCameraRetro,
} from "@fortawesome/free-solid-svg-icons";

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
              {/* <div>Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div> */}
              <FontAwesomeIcon icon={faCameraRetro} />{" "}
              <span style={{ marginLeft: "5px" }}>Qarr</span>
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
              <a className="navbar-item" href="/scan">
                Scan
              </a>
              <a className="navbar-item" href="/create">
                Create
              </a>
            </div>
          </div>
        </nav>

        <Switch>
          <Route exact path="/"></Route>
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
            <div className="notification is-primary">
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
    const size = window.innerWidth <= 500 ? 256 : 1024;
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
  componentDidUpdate() {
    const scale = window.innerWidth <= 500 ? 5 : 15;
    QRCode.toCanvas(
      this.canvas.current,
      this.props.value || "",
      { scale },
      function (error) {
        if (error) console.error(error);
        console.log("success!");
      }
    );
  }

  render() {
    return (
      <div>
        <canvas
          ref={this.canvas}
          style={{ width: "640px", height: "640px" }}
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
  render() {
    const size = window.innerWidth <= 500 ? 270 : 1024;
    return (
      <div className="columns is-mobile is-centered is-vcentered">
        <div className="column is-12">
          <div className="notification is-primary">
            <div style={{ textAlign: "center" }}>
              <QRCodeComp value={this.state.text} />
            </div>

            <br />
            <div className="field">
              <div className="control">
                <textarea
                  onChange={this.handleOnChange}
                  style={{ color: "black" }}
                  className="textarea is-primary"
                  placeholder="Type to create..."
                  value={this.state.value}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
