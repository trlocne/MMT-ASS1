import React, { useContext, useEffect, useRef } from 'react';
import { GlobalContext } from '../../context/index.jsx';
import VideoCallInterface from '../Modals/VideoCallInterface';

export default function MessagesArea({ messages }) {
  const { currentChannel, currentServer, servers } = useContext(GlobalContext);
  const currentServerData = servers.find((server) => server.id === currentServer);
  const isVoiceChannel = currentServerData?.voiceChannels.includes(currentChannel);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div id="messages-container" className="flex-1 overflow-y-auto space-y-4">
      {isVoiceChannel ? (
        <div className="sticky top-0 z-10">
          <VideoCallInterface />
        </div>
      ) : null}
      <div className="px-4 pt-4">
        {messages?.map((message, index) => (
          <Message
            key={index}
            user={message?.user}
            text={message?.text}
            timestamp={message?.timestamp}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function Message({ user, text, timestamp }) {
  return (
    <div className="flex items-center mb-2 space-x-4">
      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
        {user[0]}
      </div>
      <div>
        <div className="flex items-baseline space-x-4">
          <span className="font-semibold">{user}</span>
          <span className="text-xs text-gray-400">{timestamp}</span>
        </div>
        <p className="text-gray-100 w-fit">{text}</p>
      </div>
    </div>
  );
}