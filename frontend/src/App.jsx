import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import ServerSidebar from './components/Sidebar/ServerSidebar';
import ChannelSidebar from './components/Sidebar/ChannelSidebar';
import MainContent from './components/MainContent/MainContent';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import { GlobalContext } from './context';

export default function App() {
  const [currentChannel, setCurrentChannel] = useState('chat');
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages ? JSON.parse(savedMessages) : {};
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


  const MainApp = () => (
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

  const {isAuthenticated} = useContext(GlobalContext);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
        <Route
          path="/*"
          element={isAuthenticated ? <MainApp /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}