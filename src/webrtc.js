import { v4 as uuid } from 'uuid';
// eslint-disable-next-line no-undef
var RTCPeerConnection = window.RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;


export default class WebRTC {

  constructor() {
    this.peerConn = new RTCPeerConnection({'iceServers': [{'urls': ['stun:stun.l.google.com:19302']}]});
    this.isOpen = false;
    this.onOpen = () => {};
    this.onMessage = (msg) => {};
    this.onClose = () => {};
    this.send = (msg) => {
      if (this.isOpen) {
        if (typeof msg === 'object' && msg !== null) {
          msg = JSON.stringify(msg);
        }
        this.dataChannel.send(msg);
      }
    };
  }

  _onMessage = (msg) => {
    try {
      this.onMessage(JSON.parse(msg));
    }
    catch(e) {
      this.onMessage(msg);
    }
  }

  answer(answer) {
    this.peerConn.setRemoteDescription(new RTCSessionDescription(answer));

  }

  async create() {
    return new Promise(async (resolve, reject) => {
      const channel = uuid();
      var dataChannel = this.peerConn.createDataChannel(channel);
      this.dataChannel = dataChannel;
      dataChannel.onopen = (e) => {
        this.isOpen = true;
        this.onOpen();
        // this.onOpen(e);
      };
      dataChannel.onmessage = (e) => { this._onMessage(e.data); };
      dataChannel.onclose = (e) => { this.onClose(e) };
      const desc = await this.peerConn.createOffer({});
      await this.peerConn.setLocalDescription(desc);

      this.peerConn.onicecandidate = (e) => {
        if (e.candidate == null) {
          return resolve(this.peerConn.localDescription);
        }
      };
    })
    
  }

  async join(offer) {
    if (typeof offer === 'string') {
      offer = JSON.parse(atob(offer));
    }

    return new Promise(async (resolve, reject) => {
      
          this.peerConn.ondatachannel = (e) => {
            var dataChannel = e.channel;
            this.dataChannel = dataChannel;
            // this.sendChannel = e.channel;
            // console.log('channel', e.channel)
            dataChannel.onopen = (e) => {
              // window.say = (msg) => { dataChannel.send(msg); };
              this.isOpen = true;
              this.onOpen();

            };
            dataChannel.onmessage = (e) => { this._onMessage(e.data); }
            dataChannel.onclose = (e) => { this.onClose(e) };
          };
        
          this.peerConn.onicecandidate = (e) => {
            if (e.candidate == null) {
              return resolve(this.peerConn.localDescription);
            }
          };
        
          var offerDesc = new RTCSessionDescription(offer);
          this.peerConn.setRemoteDescription(offerDesc);

          const answerDesc = await this.peerConn.createAnswer({})
          this.peerConn.setLocalDescription(answerDesc)

    })
  }
}