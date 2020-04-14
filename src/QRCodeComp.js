import React from "react";
const QRCode = require("qrcode");
export class QRCodeComp extends React.Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }
  renderQrCodeToCanvas = () => {
    const scale = window.innerWidth <= 500 ? 5 : 15;
    QRCode.toCanvas(this.canvas.current, this.props.value || "Type to create...", { scale }, function (error) {
      if (error)
        console.error(error);
    });
  };
  componentDidMount() {
    if (this.props.value) {
      this.renderQrCodeToCanvas();
    }
  }
  componentDidUpdate() {
    if (this.props.value) {
      this.renderQrCodeToCanvas();
    }
  }
  render() {
    const style = Object.assign({},
      { width: "128px", height: "128px", maxWidth: '400px', maxHeight: '400px' }
    , this.props.style || {});
    if (!this.props.value) {
      return this.props.defaultComponent || '';
    }
    return (<div>
      <canvas id="canvas" ref={this.canvas} style={style}></canvas>
    </div>);
  }
}
