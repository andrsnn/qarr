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

function splitIntoChunks(str = '', size = 30) {
  var chunks = [];
  var chunk = '';
  for (var i = 0; i < str.length; i++) {
      if (i && i % size === 0) {
          chunks.push(chunk);
          chunk = '';
      }
      else {
          chunk += str[i];
      }
  }
  return chunks;
}

// function wait(timeout = 200) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => resolve(), timeout);
//   });
// }

const msgChunkState = {};

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

async function encrypt({ plaintext, peerPublicKey }) {
  const encodedPlaintext = base64ToArrayBuffer(btoa(plaintext));
  const encryptedText = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    peerPublicKey,
    encodedPlaintext
  );

  return arrayBufferToBase64(encryptedText);
}

async function decrypt({ ciphertext, privateKey }) {
  const ciphertextAsArrayBuf = base64ToArrayBuffer(ciphertext);

  const decryptedText = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    ciphertextAsArrayBuf
  );
  return arrayBufferToUtf16(decryptedText);
}

async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return keyPair;
}

async function extractPublicKey({ publicKey }) {
  const jwkPublicKey = await crypto.subtle.exportKey("jwk", publicKey);

  const encodedPublicKey = btoa(JSON.stringify(jwkPublicKey));

  return encodedPublicKey;
}

async function importPeerPublicKey({ encodedPeerPublicKey }) {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(atob(encodedPeerPublicKey)),
    {
      name: "RSA-OAEP",
      hash: { name: "SHA-256" },
    },
    false,
    ["encrypt"]
  );
  return publicKey;
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

  getInitialNavigateToMessage = ({ query, link }) => {
    return [
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
                    <CopyButton className="is-link" target="#joinLink" />
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
    ];
  };

  componentDidMount() {
    const query = this.parseQueryStringParams();
    if (query.data) {
      const parsedData = JSON.parse(atob(query.data));
      const link = window.location.href + `?data=${query.data}`;

      const channelId = parsedData.channelId;

      generateKeyPair()
        .then((keyPair) => {
          // should this be attached to this.state?
          this.keyPair = keyPair;

          this.setState(
            {
              value: query.data,
              channelId,
              clientId: uuid(),
              connecting: true,
              messages: this.getInitialNavigateToMessage({ query, link }),
            },
            () => {
              window.history.pushState({}, document.title, "/send");

              this.handleJoin();
            }
          );
        })
        .catch((err) => {
          console.error(err);
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
            async () => {
              const publicKey = await extractPublicKey({
                publicKey: this.keyPair.publicKey,
              });
              this.state.socket.emit("data", {
                channelId: this.state.channelId,
                data: {
                  event: "join",
                  clientId: this.state.clientId,
                  publicKey,
                  info,
                },
              });
            }
          );
        });

        socket.on("data", async (msg) => {
          console.log("data", msg);
          if (msg && msg.data) {
            const messages = this.state.messages;
            if (msg.data.event === "join") {
              if (msg.data.clientId !== this.state.clientId) {
                const peerPublicKey = await importPeerPublicKey({
                  encodedPeerPublicKey: msg.data.publicKey,
                });

                messages.push({
                  author: "narrator",
                  type: "text",
                  data: {
                    text: `Peer joined: ${JSON.stringify(msg.data.info)}`,
                  },
                });
                return this.setState({ messages, peerPublicKey });
              } else {
                messages.push({
                  author: "narrator",
                  type: "text",
                  data: {
                    text: `Connected!`,
                  },
                });
                this.setState({ messages });
              }
            } else if (msg.data.event === "message") {
              if (msg.data.clientId !== this.state.clientId) {
                try {
                  const j = JSON.parse(msg.data.message);
                  if (j.msgId) {
                    const message = await decrypt({
                      ciphertext: j.c,
                      privateKey: this.keyPair.privateKey,
                    });
                    j.c = message;
                    let chunks = msgChunkState[j.msgId] = msgChunkState[j.msgId] || [];
                    chunks.push(j);
                    if (chunks.length >= j.len) {
                      chunks = chunks.sort((a, b) => {
                        return a.i > b.i ? 1 : -1;
                      });
                      const fullMsg = chunks.map(chunk => chunk.c);
                      messages.push({
                        author: "them",
                        type: "text",
                        data: {
                          text: fullMsg,
                        },
                      });
                      this.setState({
                        messages,
                      });
                      delete msgChunkState[j.msgId];
                    }
                    return;
                  }
                }
                catch(e) {

                }

                const message = await decrypt({
                  ciphertext: msg.data.message,
                  privateKey: this.keyPair.privateKey,
                });
                messages.push({
                  author: "them",
                  type: "text",
                  data: {
                    text: message,
                  },
                });
                this.setState({
                  messages,
                });
              }
            }
          }
        });
      }
    );
  };

  send = async ({ message = "" }) => {
    if (message.length >= 90) {
      const msgId = uuid();
      let chunks = splitIntoChunks(message);
      const encChunks = [];

      for (let chunk of chunks) {
        const ciphertext = await encrypt({
          plaintext: chunk,
          peerPublicKey: this.state.peerPublicKey,
        });
        encChunks.push(ciphertext);
      }

      const chunksToSend = encChunks.map((c, i) => {
        return JSON.stringify({
          len: encChunks.length,
          msgId,
          i,
          c
        });
      });

      for (let chunk of chunksToSend) {
        this.state.socket.emit("data", {
          channelId: this.state.channelId,
          data: {
            message: chunk,
            clientId: this.state.clientId,
            event: "message",
          },
        });
      }
    }
    else {
      const ciphertext = await encrypt({
        plaintext: message,
        peerPublicKey: this.state.peerPublicKey,
      });
  
      this.state.socket.emit("data", {
        channelId: this.state.channelId,
        data: {
          message: ciphertext,
          clientId: this.state.clientId,
          event: "message",
        },
      });
    }
  };

  getInitialMessage = ({ value, link }) => {
    return [
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
                  <div className="control" style={{ marginRight: "auto" }}>
                    {/* <a className="button is-info">
                                Copy
                            </a> */}
                    <CopyButton className="is-link" target="#joinLink" />
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
    ];
  };

  handleConnect = async () => {
    const keyPair = await generateKeyPair();
    // should this be attached to this.state?
    this.keyPair = keyPair;

    const channelId = uuid();
    const value = btoa(JSON.stringify({ channelId, event: "qarr-join-chat" }));
    const link = window.location.href + `?data=${value}`;

    this.setState(
      {
        value,
        channelId,
        messages: this.getInitialMessage({ value, link }),
        clientId: uuid(),
        connecting: true,
        hasInitiated: true,
      },
      () => {
        this.handleJoin();
      }
    );
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
        this.send({ message: e.data.text });
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
                A channel ID is exchanged in the shared QR code or link. When a
                peer navigates to the link, their browser connects to the web
                socket server, and attaches to the same channel ID.  No cryptographic
                information is exchanged in the QR code or link.
              </li>
              <br />
              <li>
                A RSA asymmetric key pair is generated upon initial navigation
                to the page. When a peer joins the channel, the peer sends their
                public key to the other party. When a message is sent, the
                message is then encrypted using the peer's public key, then is
                decrypted by the peer with their private key using RSA-OAEP.
              </li>
              <br />
              <li>
                The key pair is generated locally, on your browser, and never
                leaves your machine. The encryption process uses native browser
                crypto implementations (crypto.subtle).
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
