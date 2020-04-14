import React, { Component } from 'react';
import TextMessage from './TextMessage';
import EmojiMessage from './EmojiMessage';
import FileMessage from './FileMessage';
import chatIconUrl from './../../assets/chat-icon.svg';


class Message extends Component {

  _renderMessageOfType(type) {
    switch(type) {
    case 'text':
      return <TextMessage {...this.props.message} />;
    case 'emoji':
      return <EmojiMessage {...this.props.message} />;
    case 'file':
      return <FileMessage {...this.props.message} />;
    case 'component':
      return this.props.message.text;
    default:
      console.error(`Attempting to load message with unsupported file type '${type}'`);
    }
  }

  render () {
    let contentClassList = [
      'sc-message--content',
      (this.props.message.author === 'me' ? 'sent' : 'received')
    ];
    const messageClassList = [
      'sc-message',
      (this.props.message.author === 'me'
        ? 'sc-message--me'
        : this.props.message.author === 'them'
        ? 'sc-message--them'
        : 'sc-message--narrator')
    ]
    return (
      <div className={messageClassList.join(' ')}>
        <div className={contentClassList.join(' ')}>
          {this.props.message.author !== 'me'  && <div className="sc-message--avatar" style={{
            backgroundImage: `url(${chatIconUrl})`
          }}></div>}
          
          {this._renderMessageOfType(this.props.message.type)}
          {this.props.message.author === 'me' && <div className="sc-message--avatar" style={{
            backgroundImage: `url(${chatIconUrl})`
          }}></div>}
        </div>
      </div>);
  }
}

export default Message;
