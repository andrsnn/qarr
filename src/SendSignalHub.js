import React from "react";

import { v4 as uuid } from "uuid";
import deviceInfo from "./device-info";

import { QRCodeComp } from "./QRCodeComp";
import { CopyButton } from "./CopyButton";
import ChatWindow from "./react-chat-window/components/ChatWindow";
import WebRTC from "./webrtc";

var signalhub = require("signalhub");
const info = deviceInfo.get()

var hub = signalhub("qarr", [
  "https://qarr.herokuapp.com/",
]);

function arrayBufferToBase64(buffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToUtf16(buffer) {
  let binary = "";
  let bytes = new Uint8Array(buffer);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

async function encrypt(plaintext, cryptoKey) {
  plaintext = btoa(JSON.stringify(plaintext));

  let enc = new TextEncoder();
  enc = enc.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    cryptoKey,
    enc
  );

  var ivB64 = arrayBufferToBase64(iv);
  var cipherB64 = arrayBufferToBase64(encrypted);

  return btoa(JSON.stringify({ iv: ivB64, cipher: cipherB64 }));
}

async function decrypt(ciphertext, cryptoKey) {
  const data = JSON.parse(atob(ciphertext));
  const iv = base64ToArrayBuffer(data.iv);
  const cipher = base64ToArrayBuffer(data.cipher);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    cipher
  );
  return JSON.parse(atob(arrayBufferToUtf16(decrypted)));
}

export default class Send extends React.Component {
  state = {
    value: "",
    subscribed: false,
    peers: [],
    messages: [],
    isInitiator: true,
  };
  constructor(props) {
    super(props);
    this.webrtc = new WebRTC();
    this.webrtc.onMessage = async (msg) => {
      msg = await decrypt(msg, this.cryptoKey);

      if (msg.clientId !== this.state.clientId) {
        const messages = this.state.messages;
        messages.push({
          author: "them",
          type: "text",
          data: {
            text: msg.message,
          },
        });
        this.setState({
          messages,
        });
      }
    };
    this.webrtc.onOpen = () => {
      this.sendWebRtc({
        clientId: this.state.clientId,
        event: "complete",
        message: "Web RTC handshake complete.",
      });
    };
    this.webrtc.onClose = () => {
      window.location.replace(window.location.href);
    };
  }

  parseQueryStringParams = () => {
    const params = {};
    if (window.location.search) {
      const query = window.location.search.replace("?", "");
      query
        .split("&")
        .map((e) => e.split("="))
        .forEach((e) => {
          params[e[0]] = e[1];
        });
    }
    return params;
  };

  componentDidMount() {
    const query = this.parseQueryStringParams();
    if (query.data) {
      const parsedData = JSON.parse(atob(query.data));
      const link = window.location.href + `?data=${query.data}`;

    const key = base64ToArrayBuffer(parsedData.key);

      crypto.subtle
        .importKey("raw", key, {name: 'AES-GCM'}, true, [
          "encrypt",
          "decrypt",
        ])
        .then((cryptoKey) => {
          this.cryptoKey = cryptoKey;

          this.setState(
            {
              key: parsedData.key,
              isInitiator: false,
              value: query.data,
              channelId: parsedData.channelId,
              // client id should include info about the device
              clientId: uuid(),
              connecting: true,
              peers: [info],
              messages: [
                {
                  author: "narrator",
                  type: "text",
                  data: {
                    text: `To establish a peer to peer chat, have a friend scan the following QR code or navigate to the below link.`,
                  },
                },
                {
                  author: "narrator",
                  type: "text",
                  data: {
                    text: (
                      <div>
                        <div style={{ textAlign: "center" }}>
                          <QRCodeComp
                            value={query.data}
                            style={{
                              maxWidth: "400px",
                              width: "100%",
                              maxHeight: "400px",
                            }}
                          />
                        </div>
                        <div>
                          <div
                            className="field has-addons"
                            style={{
                              marginLeft: "auto",
                              marginRight: "auto",
                              width: "400px",
                            }}
                          >
                            <div className="control" style={{ width: "320px" }}>
                              <input
                                className="input"
                                type="text"
                                id="joinLink"
                                defaultValue={link}
                              />
                            </div>
                            <div className="control">
                              {/* <a className="button is-info">
                                            Copy
                                        </a> */}
                              <CopyButton
                                className="is-link"
                                target="#joinLink"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                },
                {
                  author: "narrator",
                  type: "text",
                  data: {
                    text: `Please wait while we connect...`,
                  },
                },
              ],
            },
            () => {
              window.history.pushState({}, document.title, "/send");

              this.handleJoin();
            }
          );
        });
    }
  }

  getConnectInfoStr = (info) => {
    let finStr = "";
    Object.keys(info || {}).forEach((key) => {
      const val = info[key];
      Object.keys(val).forEach((valKey) => {
        const value = val[valKey];
        finStr += value + " ";
      });
      finStr += " - ";
    });
    finStr = finStr.trim();
    return finStr.slice(0, finStr.length - 2);
  };

  handleJoin = () => {
    if (this.state.subscribed) {
      return;
    }

    const sub = hub.subscribe(this.state.channelId);

    sub.on("data", async (message) => {

      if (message) {
        if (message.event === "join") {
          if (message.clientId === this.state.clientId) {
            const messages = this.state.messages;

            messages.push({
              author: "Narrator",
              type: "text",
              data: {
                text: `You connected to the channel. ${this.getConnectInfoStr(
                  info
                )}.  Waiting for peers...`,
              },
            });
            this.setState({
              messages,
            });
          } else {
            //   clearInterval(this.state.interval);
            const peers = this.state.peers;

            peers.push({
              clientId: message.clientId,
              info: message.info,
            });

            const messages = this.state.messages;

            messages.push({
              author: "Narrator",
              type: "text",
              data: {
                text: `A peer has connected ${this.getConnectInfoStr(
                  message.info
                )}.  Establishing web rtc tunnel...`,
              },
            });
            // add peer
            this.setState(
              {
                isConnectedToPeer: true,
                peers,
                messages,
                interval: null,
              },
              this.startWebRtc
            );
          }
        }
        if (message.clientId !== this.state.clientId) {
          if (message.event === "offer") {
            const messages = this.state.messages;
            messages.push({
              author: "Narrator",
              type: "text",
              data: {
                text: `Offer received...`,
              },
            });
            this.setState(
              {
                messages,
              },
              async () => {
                const answer = await this.webrtc.join(message.offer);
                this.send({
                  event: "answer",
                  answer,
                  clientId: this.state.clientId,
                });
              }
            );
          } else if (message.event === "answer") {
            const messages = this.state.messages;
            messages.push({
              author: "Narrator",
              type: "text",
              data: {
                text: `Answer received...`,
              },
            });
            this.setState(
              {
                messages,
              },
              async () => {
                this.webrtc.answer(message.answer);
              }
            );
          }
        }
      }
    });

    sub.on("open", () => {
      this.setState(
        {
          connecting: false,
          connected: true,
        },
        () => {
          this.send({ event: "join", clientId: this.state.clientId, info });
        }
      );
    });

    // const interval = setInterval(() => {
    //     if (this.state.connected && !this.state.isConnectedToPeer) {
    //         this.send({ event: "join", clientId: this.state.clientId, info });
    //     }
    // }, 5000);

    this.setState({
      subscribed: true,
      //   interval
    });
  };

  startWebRtc = async () => {
    if (this.state.isInitiator) {
      const offer = await this.webrtc.create();

      this.send({ event: "offer", offer, clientId: this.state.clientId });
    }
  };

  send = (msg) => {
    hub.broadcast(this.state.channelId, msg);
  };

  handleConnect = () => {
    window.crypto.subtle
      .generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      )
      .then((key) => {
        this.cryptoKey = key;
        crypto.subtle.exportKey("raw", key).then((rawKey) => {
            const outKey = arrayBufferToBase64(rawKey);
          const channelId = uuid();
          const value = btoa(
            JSON.stringify({
              key: outKey,
              channelId,
              event: "qarr-join-chat",
            })
          );
          const link = window.location.href + `?data=${value}`;
          this.setState(
            {
              key: outKey,
              value,
              channelId,
              // client id should include info about the device
              clientId: uuid(),
              connecting: true,
              peers: [info],
              messages: [
                {
                  author: "narrator",
                  type: "text",
                  data: {
                    text: `To establish a peer to peer chat, have a friend scan the following QR code or navigate to the below link.`,
                  },
                },
                {
                  author: "narrator",
                  type: "text",
                  data: {
                    text: (
                      <div>
                        <div style={{ textAlign: "center" }}>
                          <QRCodeComp
                            value={value}
                            style={{
                              maxWidth: "400px",
                              width: "100%",
                              maxHeight: "400px",
                            }}
                          />
                        </div>
                        <div>
                          <div
                            className="field has-addons"
                            style={{
                              marginLeft: "auto",
                              marginRight: "auto",
                              width: "400px",
                            }}
                          >
                            <div className="control" style={{ width: "320px" }}>
                              <input
                                className="input"
                                type="text"
                                id="joinLink"
                                defaultValue={link}
                              />
                            </div>
                            <div className="control">
                              {/* <a className="button is-info">
                                          Copy
                                      </a> */}
                              <CopyButton
                                className="is-link"
                                target="#joinLink"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                },
                {
                  author: "narrator",
                  type: "text",
                  data: {
                    text: `Please wait while we connect...`,
                  },
                },
              ],
            },
            () => {
              this.handleJoin();
            }
          );
        });
      });
  };

  sendWebRtc = async (msg) => {
    msg = await encrypt(msg, this.cryptoKey);
    this.webrtc.send(msg);
  };

  handleUserChat = (e) => {
    const messages = this.state.messages;

    messages.push(e);

    this.setState(
      {
        messages,
      },
      () => {
        this.sendWebRtc({
          event: "message",
          message: e.data.text,
          clientId: this.state.clientId,
        });
      }
    );
  };

  render() {
    if (this.state.peers.length) {
      return (
        <ChatWindow
          agentProfile={{
            teamName: "Secure Chat",
            imageUrl: "",
          }}
          onMessageWasSent={() => {}}
          onClose={() => {}}
          onUserInputSubmit={this.handleUserChat}
          messageList={this.state.messages}
          showEmoji
        />
      );
    }
    return (
      <div
        className="columns notification is-success is-light"
        style={{ backgroundColor: "#75776354", paddingRight: "24px" }}
      >
        <div className="column" style={{ textAlign: "center" }}>
          <div>
            {!this.state.value && (
              <div>
                <div
                  style={{
                    backgroundColor: "rgba(0,0,0,0.5)",
                    width: "100%",
                    height: "400px",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  <div className="buttons">
                    <button
                      className="button is-link"
                      onClick={this.handleConnect}
                      style={{
                        fontSize: "20px",
                        marginLeft: "auto",
                        marginRight: "auto",
                        marginTop: "175px",
                      }}
                    >
                      Connect...
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
