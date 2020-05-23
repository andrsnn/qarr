/* eslint-disable no-mixed-operators */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";

import { v4 as uuid } from "uuid";
import deviceInfo from "./device-info";

import { QRCodeComp } from "./QRCodeComp";
import { CopyButton } from "./CopyButton";
import ChatWindow from "./react-chat-window/components/ChatWindow";

const info = deviceInfo.get();

var io = require("socket.io-client");

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
        .importKey("raw", key, { name: "AES-GCM" }, true, [
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
                              width: "100%",
                              maxWidth:
                                document.documentElement.clientWidth <= 500
                                  ? "225px"
                                  : "400px",
                              maxHeight:
                                document.documentElement.clientWidth <= 500
                                  ? "225px"
                                  : "400px",
                            }}
                          />
                        </div>
                        <div>
                          <div
                            className="field has-addons"
                            style={{
                              marginLeft: "auto",
                              marginRight: "auto",
                              width: "100%",
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

    const url = window.location.hostname.includes("localhost")
      ? "http://localhost:3001/"
      : "https://warm-depths-81051.herokuapp.com/";

    const socket = io.connect(url);

    this.setState(
      {
        socket,
        subscribed: true,
      },
      () => {
        socket.on("connect", () => {
          socket.emit("join-channel", this.state.channelId);
        });

        socket.on("open", (msg) => {
          console.log("open", msg);
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

        socket.on("data", async (msg) => {
          const message = await decrypt(msg.data, this.cryptoKey);
          console.log('message', message);
          if (message) {
            
            const messages = this.state.messages;
      
            if (message.clientId !== this.state.clientId) {
              if (message.event === 'join') {
                messages.push({
                  author: "narrator",
                  type: "text",
                  data: {
                    text: `Peer joined: ${JSON.stringify(message.info)}`,
                  }
                });
                return this.setState({ messages });
              }
              messages.push({
                author: "them",
                type: "text",
                data: {
                  text: message.message,
                },
              });
              this.setState({
                messages
              });
            }
            else if (message.event === 'join') {
              messages.push({
                author: "narrator",
                type: "text",
                data: {
                  text: `Connected!`,
                }
              });
              this.setState({ messages });
            }
          }
        });
      }
    );
  };

  send = async (msg) => {
    msg = await encrypt(msg, this.cryptoKey);
    this.state.socket.emit("data", {
      channelId: this.state.channelId,
      data: msg,
    });
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
              hasInitiated: true,
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
                              maxWidth:
                                document.documentElement.clientWidth <= 500
                                  ? "225px"
                                  : "400px",
                              maxHeight:
                                document.documentElement.clientWidth <= 500
                                  ? "225px"
                                  : "400px",
                              width: "100%",
                            }}
                          />
                        </div>
                        <div>
                          <div
                            className="field has-addons width-100"
                            style={{
                              marginLeft: "auto",
                              marginRight: "auto",
                              width: "100%",
                            }}
                          >
                            <div
                              className="control"
                              style={{ width: "320px", marginLeft: "auto" }}
                            >
                              <input
                                className="input"
                                type="text"
                                id="joinLink"
                                defaultValue={link}
                              />
                            </div>
                            <div
                              className="control"
                              style={{ marginRight: "auto" }}
                            >
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

  handleUserChat = (e) => {
    const messages = this.state.messages;

    if (!this.state.connected) {
      messages.push({
        author: "narrator",
        type: "text",
        data: {
          text: 'Not connected. Please click "connect" to start the chat...',
        },
      });

      return this.setState({
        messages,
      });
    }

    messages.push(e);

    this.setState(
      {
        messages,
      },
      () => {
        this.send({
          event: "message",
          message: e.data.text,
          clientId: this.state.clientId,
        });
      }
    );
  };

  howSecure = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const messages = this.state.messages;

    messages.push({
      author: "narrator",
      type: "text",
      data: {
        text: (
          <div>
            <p>
              <a href="" onClick={(e) => e.preventDefault()}>
                How is this secure?
              </a>
            </p>
            <br />
            <ul>
              <li>
                An encryption key unknown to the server is exchanged in the
                shared QR code or link. When a message is sent, the message is
                encrypted with this symmetric key using AES-GCM.
              </li>
              <br />
              <li>
                The key is generated locally, on your browser, and never leaves
                your machine. The encryption process uses native browser crypto
                implementations (crypto.subtle).
              </li>
            </ul>
          </div>
        ),
      },
    });

    this.setState({
      messages,
    });
  };

  onFilesSelected = () => {
    const messages = this.state.messages;

    messages.push({
      author: "narrator",
      type: "text",
      data: {
        text: "Not yet implemented...",
      },
    });

    this.setState({
      messages,
    });
  };

  render() {
    const messages = [
      {
        author: "narrator",
        type: "text",
        data: {
          text: (
            <div>
              <p>
                Start an encrypted peer to peer chat by clicking connect below.{" "}
                <a href="" onClick={this.howSecure}>
                  How is this secure?
                </a>
              </p>
            </div>
          ),
        },
      },
      {
        author: "narrator",
        type: "text",
        data: {
          text: (
            <div
              className="columns notification is-success is-light"
              style={{ backgroundColor: "#75776354", paddingRight: "24px" }}
            >
              <div className="column" style={{ textAlign: "center" }}>
                <div>
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
                          disabled={this.state.hasInitiated}
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
                </div>
              </div>
            </div>
          ),
        },
      },
      ...this.state.messages,
    ];
    return (
      <ChatWindow
        agentProfile={{
          teamName: "Secure Chat",
          imageUrl: "",
        }}
        onMessageWasSent={() => {}}
        onClose={() => {}}
        onUserInputSubmit={this.handleUserChat}
        onFilesSelected={this.onFilesSelected}
        messageList={messages}
        showEmoji
      />
    );
  }
}
