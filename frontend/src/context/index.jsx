import React, { createContext, useState, useEffect } from 'react';

// Tạo Context
export const GlobalContext = createContext();

export default function GlobalState({ children }) {
  const [currentChannel, setCurrentChannel] = useState('chat');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const savedUsers = localStorage.getItem('registeredUsers');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });
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

  useEffect(() => {
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const registerUser = (userData) => {
    const userExists = registeredUsers.some(user => user.email === userData.email);
    if (userExists) {
      return { success: false, message: 'Email already registered' };
    }
    setRegisteredUsers(prev => [...prev, userData]);
    return { success: true, message: 'Registration successful' };
  };

  const loginUser = async (email, password) => {
    const user = registeredUsers.find(u => u.email === email && u.password === password);
    if (user) {
      setIsAuthenticated(true);
      setUserName(user.username);
      return { success: true, message: 'Login successful' };
    }
    return { success: false, message: 'Invalid credentials' };
  };

  const participants = [
    { name: "Duy Phương Lộc", avatar: "https://via.placeholder.com/150" },
    { name: "John Doe", avatar: "https://via.placeholder.com/150" },
    { name: "Alice", avatar: "https://via.placeholder.com/150" },
    { name: "Bob", avatar: "https://via.placeholder.com/150" },
  ];

  const handleSendMessage = (message) => {
    setMessages((prevMessages) => ({
      ...prevMessages,
      [currentChannel]: [
        ...(prevMessages[currentChannel] || []),
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
    isAuthenticated,
    setIsAuthenticated,
    registerUser,
    loginUser,
    isVideoOn,
    setIsVideoOn,
    participants
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}