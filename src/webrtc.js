import { v4 as uuid } from 'uuid';
// eslint-disable-next-line no-undef
var RTCPeerConnection = window.RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;


export default class WebRTC {

  constructor() {
    this.peerConn = new RTCPeerConnection({'iceServers': [{'urls': ['stun:stun.l.google.com:19302']}]});
    this.isOpen = false;
    this.onOpen = () => {};
    this.onMessage = () => {};
    this.send = (msg) => {
      if (this.isOpen) {
        this.dataChannel.send(msg);
      }
    };
  }

  answer(answer) {
    this.peerConn.setRemoteDescription(new RTCSessionDescription(answer));

  }

  async create() {
    alert("Creating ...");
    return new Promise(async (resolve, reject) => {
      const channel = uuid();
      var dataChannel = this.peerConn.createDataChannel(channel);
      this.dataChannel = dataChannel;
      dataChannel.onopen = (e) => {
        alert('open1', e);
        this.isOpen = true;
        // this.onOpen(e);
      };
      dataChannel.onmessage = (e) => { this.onMessage(e.data); };
      const desc = await this.peerConn.createOffer({});
      await this.peerConn.setLocalDescription(desc);

      this.peerConn.onicecandidate = (e) => {
        if (e.candidate == null) {
          return resolve(this.peerConn.localDescription);
          // alert("Get joiners to call: ", "join(", JSON.stringify(peerConn.localDescription), ")");
        }
      };
    })
    
  }

  async join(offer) {
    if (typeof offer === 'string') {
      offer = JSON.parse(atob(offer));
    }
    alert("Joining ...");

    return new Promise(async (resolve, reject) => {
      
          this.peerConn.ondatachannel = (e) => {
            var dataChannel = e.channel;
            this.dataChannel = dataChannel;
            // this.sendChannel = e.channel;
            // console.log('channel', e.channel)
            dataChannel.onopen = (e) => {
              this.onOpen();
              // window.say = (msg) => { dataChannel.send(msg); };
              alert('open2', e);
              this.isOpen = true;
            };
            dataChannel.onmessage = (e) => { this.onMessage(e.data); }
          };
        
          this.peerConn.onicecandidate = (e) => {
            if (e.candidate == null) {
              alert("Get the creator to call: gotAnswer(", JSON.stringify(this.peerConn.localDescription), ")");
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