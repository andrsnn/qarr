import PropTypes from 'prop-types';
import React, { Component } from 'react';
import MessageList from './MessageList';
import UserInput from './UserInput';
import Header from './Header';
import '../styles';

class ChatWindow extends Component {
  onUserInputSubmit(message) {
    this.props.onUserInputSubmit(message);
  }

  onFilesSelected(filesList) {
    this.props.onFilesSelected(filesList);
  }

  render() {
    let messageList = this.props.messageList || [];
    let classList = ['sc-chat-window', 'opened'];
    return (
      <div>
        <div className={classList.join(' ')}>
          <Header
            teamName={this.props.agentProfile.teamName}
            imageUrl={this.props.agentProfile.imageUrl}
            onClose={this.props.onClose}
          />
          <MessageList
            messages={messageList}
            imageUrl={this.props.agentProfile.imageUrl}
          />
          <UserInput
            onSubmit={this.onUserInputSubmit.bind(this)}
            onFilesSelected={this.onFilesSelected.bind(this)}
            showEmoji={this.props.showEmoji}
          />
        </div>
      </div>
    );
  }
}

ChatWindow.propTypes = {
  agentProfile: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onFilesSelected: PropTypes.func,
  onUserInputSubmit: PropTypes.func.isRequired,
  showEmoji: PropTypes.bool,
};

export default ChatWindow;
