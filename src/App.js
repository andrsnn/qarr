import React from "react";
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom";
import "./App.sass";
import "./App.css";

import Password from './password';

import logo from "./logo.svg";
import { Section } from "./Section";
import { Scan } from "./Scan";
import { Create } from "./Create";
import { Run } from './Run';
import Send from './Send';

export const password = new Password();

export default class Root extends React.Component {
  render() {
    const pathname = window.location.pathname;
    console.log(pathname);
    if (pathname === '/run') {
      return <Run/>
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
              <img alt="Qarr" src={logo} style={{ maxHeight: "4rem" }} />
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
              <a className="navbar-item" href="/send">
                Send
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
          <Route path="/send">
            <Section>
              <Send />
            </Section>
          </Route>
        </Switch>
      </Router>
    );
  }
}


