import React, { useContext } from 'react';
import { GlobalContext } from '../../context/index.jsx';
import MessagesArea from './MessagesArea';
import MessageInput from './MessageInput';

import { faSearch, faInbox, faHashtag, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export default function MainContent() {
  const { currentChannel, messages, handleSendMessage } = useContext(GlobalContext);

  return (
    <div className="flex-1 flex flex-col bg-gray-700">
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <div className="flex items-center">
            <FontAwesomeIcon icon={faHashtag} className="text-gray-400 mr-2" />
            <h2 className="font-semibold">{currentChannel}</h2>
        </div>

        <div className="ml-auto flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faSearch} />
            </button>
            <button className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faInbox} />
            </button>
            <button className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faQuestionCircle} />
            </button>
        </div>

        
        
      </div>
      <MessagesArea messages={messages[currentChannel]} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}