import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
const ClipboardJS = require("clipboard");
// You can think of these components as "pages"
// in your app.
export class CopyButton extends React.Component {
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
    return (<button className="button" ref={this.triggerCopy} data-clipboard-target={this.props.target}>
      <span className="icon is-small">
        <FontAwesomeIcon icon={faCopy} />
      </span>
      <span>Copy</span>
    </button>);
  }
}
