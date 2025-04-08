import React, { createContext, useState, useEffect } from 'react';

// Tạo Context
export const GlobalContext = createContext();

export default function GlobalState({ children }) {
  const [currentChannel, setCurrentChannel] = useState('chat');
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages
      ? JSON.parse(savedMessages)
      : {
          general: [],
          memes: [],
          help: [],
          lobby: [],
          strategy: [],
          announcements: [],
          events: [],
        };
  });

  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [isHeadphonesOn, setIsHeadphonesOn] = useState(true);
  const [username, setUserName] = useState('abc123');

  const [servers, setServers] = useState([
    {
      id: 1,
      name: 'Discord',
      color: '#4f46e5',
      textChannels: ['general', 'memes', 'help'],
      voiceChannels: ['General', 'Gaming', 'Music'],
    },
    {
      id: 2,
      name: 'Gaming',
      color: '#22c55e',
      textChannels: ['lobby', 'strategy'],
      voiceChannels: ['Voice Chat'],
    },
    {
      id: 3,
      name: 'Community',
      color: '#a855f7',
      textChannels: ['announcements', 'events'],
      voiceChannels: ['Community Voice'],
    },
  ]);

  const [currentServer, setCurrentServer] = useState(1);

  const addServer = (serverName, color) => {
    const newServer = {
      id: servers.length + 1,
      name: serverName,
      color,
      textChannels: [],
      voiceChannels: [],
    };
    setServers((prev) => [...prev, newServer]);
  };

  const addChannelToServer = (serverId, channelName, channelType) => {
    setServers((prevServers) =>
      prevServers.map((server) =>
        server.id === serverId
          ? {
              ...server,
              [`${channelType}Channels`]: [
                ...(server[`${channelType}Channels`] || []),
                channelName,
              ],
            }
          : server
      )
    );

    setMessages((prevMessages) => ({
      ...prevMessages,
      [channelName]: [],
    }));
  };

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = (message) => {
    setMessages((prevMessages) => ({
      ...prevMessages,
      [currentChannel]: [
        ...(prevMessages[currentChannel] || []), // Đảm bảo luôn là mảng
        message,
      ],
    }));
  };

  const contextValue = {
    currentChannel,
    setCurrentChannel,
    messages,
    setMessages,
    isMicrophoneOn,
    setIsMicrophoneOn,
    isHeadphonesOn,
    setIsHeadphonesOn,
    handleSendMessage,
    username, 
    setUserName,
    servers,
    setServers,
    currentServer,
    setCurrentServer,
    addServer,
    addChannelToServer,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}