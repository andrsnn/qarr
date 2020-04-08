import React from "react";
import WebRTC from "./webrtc";
import { QRCodeComp } from "./QRCodeComp";

import sdp from './sdp';
import QrReader from 'react-qr-reader';

export default class Send extends React.Component {
  state = {
    value: null,
    step: 'offer',
    canReadData: true,
    text: ''
  };

  constructor(props) {
    super(props);
    this.webrtc = new WebRTC();
    this.webrtc.onMessage = (msg) => {
        this.setState({
            step: msg
        })
    }
    this.webrtc.onOpen = () => {
        this.webrtc.send('compllllelelele')
    }
  }

  send = (msg) => {
    this.webrtc.send(this.state.text);
  }

  handleCreate = async () => {
    const offer = await this.webrtc.create();

    console.log(sdp);
    // var a = sdp.assembleBlob(offer)
    var a = btoa(JSON.stringify(offer));

    // offer or answer
    // const o = sdp.parseBlob(a, 'offer');

    // window.join(o);
    
    // console.log(offer)
    // console.log(a);
    // console.log(a.length, btoa(JSON.stringify(offer)).length);
    // var a = JSON.stringify(offer);
    this.setState({
      value: a,
      step: 'answer'
    });
    // var zip = new JSZip();
    // zip.file("Hello.txt", a);
    // // img.file("smile.gif", a, {base64: true});
    // zip.generateAsync({type:"base64"})
    //     .then((content) => {

    //     // see FileSaver.js
    //     // saveAs(content, "example.zip");
    // });
  };
  handleJoin = () => {};
  handleScan = async (data) => {
    
    if (data && this.state.canReadData) {
        if (this.state.step === 'offer') {
            try {
                // const o = sdp.parseBlob(data, 'offer');
                const o = JSON.parse(atob(data));
                let ans = await this.webrtc.join(o);
                ans = btoa(JSON.stringify(ans))
                // ans = sdp.assembleBlob(ans)
                alert('setting ans')
                this.setState({
                    step: 'awaiting completion',
                    value: ans,
                    canReadData: false
                })
            }
            catch(e) {
                alert(e);
            }
        }
        else if (this.state.step === 'answer') {
            alert('state ans')
            try {
                // const o = sdp.parseBlob(data, 'answer');
                const o = JSON.parse(atob(data))
                console.log('answer', o);
                this.webrtc.answer(o);
                this.webrtc.send('handshake complete');
                this.setState({
                    step: 'complete',
                    value: null
                })
            }
            catch(e) {
                alert(e);
            }
        }
    }
  }

  handleOnChange = (e) => {
      this.setState({
          text: e.target.value
      })
  }
  render() {
    return (
      <div>
        <button onClick={this.handleCreate} className="button">
          <span className="icon is-small">icon</span>
          <span>Create</span>
        </button>
        <button onClick={this.handleJoin} className="button">
          <span className="icon is-small">icon</span>
          <span>Join</span>
        </button>
        <button onClick={this.send} className="button">
          <span className="icon is-small">icon</span>
          <span>Say</span>
        </button>
        <textarea onChange={this.handleOnChange} style={{ color: "black", borderColor: "#757763" }} className="textarea is-success" placeholder="Type to create..." value={this.state.text}></textarea>
        {this.state.step}
        {this.state.value && <QRCodeComp value={this.state.value} />}

        <QrReader delay={100} showViewFinder={true} onError={this.handleError} onScan={this.handleScan} style={{ width: "100%" }} />
      </div>
    );
  }
}
