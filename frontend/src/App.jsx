import React, { useState, useEffect } from 'react';
import './App.css';
import ServerSidebar from './components/Sidebar/ServerSidebar';
import ChannelSidebar from './components/Sidebar/ChannelSidebar';
import MainContent from './components/MainContent/MainContent';

const initialMessages = {
  'chat': [
    { user: 'Alice', text: 'Hello everyone!', timestamp: '10:00 AM' },
    { user: 'Bob', text: 'Hi Alice!', timestamp: '10:01 AM' },
  ],
  'import-file': [
    { user: 'Charlie', text: 'How do I import files?', timestamp: '10:05 AM' },
  ],
  'Meet 1': [],
  'Meet 2': [],
  'Meet 3': [],
};

export default function App() {
  const [currentChannel, setCurrentChannel] = useState('chat');
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages ? JSON.parse(savedMessages) : initialMessages;
  });

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = (message) => {
    setMessages((prevMessages) => ({
      ...prevMessages,
      [currentChannel]: [...prevMessages[currentChannel], message],
    }));
  };

  return (
    <div className="bg-gray-900 text-gray-100 h-screen flex overflow-hidden">
      <ServerSidebar />

      <ChannelSidebar
        currentChannel={currentChannel}
        setCurrentChannel={setCurrentChannel}
      />

      <MainContent
        currentChannel={currentChannel}
        messages={messages[currentChannel]}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}