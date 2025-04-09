import React, { createContext, useState, useEffect } from "react";
import { api } from "../service/api";
// Tạo Context
export const GlobalContext = createContext();

export default function GlobalState({ children }) {
  const [currentChannel, setCurrentChannel] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("token") ? true : false
  );
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [isHeadphonesOn, setIsHeadphonesOn] = useState(true);
  const [username, setUserName] = useState(
    localStorage.getItem("username") ? localStorage.getItem("username") : ""
  );
  const [fullName, setFullName] = useState(
    localStorage.getItem("fullName") ? localStorage.getItem("fullName") : ""
  );
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(0);

  const fetchServers = async () => {
    try {
      const res = await api.get("/servers");
      console.log(res.data);
      setServers(res.data);
    } catch (error) {
      console.error("Error fetching servers:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchServers();
    }
  }, [isAuthenticated]);

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
    // setMessages((prevMessages) => ({
    //   ...prevMessages,
    //   [channelName]: [],
    // }));
  };

  const registerUser = async (userData) => {
    try {
      // covert userdata to json
      const payload = {
        username: userData.email,
        full_name: userData.fullname,
        password: userData.password,
      };

      const res = await api.post("/auth/register", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(res.data);
      return { success: true, message: "Registration successful" };
    } catch (error) {
      console.log(error.response.data.detail);
      return { success: false, message: error.response.data.detail };
    }
  };

  const loginUser = async (username, password) => {
    try {
      const data = new FormData();
      data.append("username", username);
      data.append("password", password);
      const res = await api.post("/auth/login", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(res.data);
      // save token to local storage
      localStorage.setItem("token", res.data.access_token);
      // call api get user info
      const userInfo = await api.get("/auth/me");
      console.log(userInfo.data);

      setIsAuthenticated(true);
      setUserName(userInfo.data.username);
      localStorage.setItem("username", userInfo.data.username);
      setFullName(userInfo.data.full_name);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("fullName", userInfo.data.full_name);
      return { success: true, message: "Login successful" };
    } catch (error) {
      return { success: false, message: "Invalid credentials" };
    }
  };

  const participants = [
    { name: "Duy Phương Lộc", avatar: "https://via.placeholder.com/150" },
    { name: "John Doe", avatar: "https://via.placeholder.com/150" },
    { name: "Alice", avatar: "https://via.placeholder.com/150" },
    { name: "Bob", avatar: "https://via.placeholder.com/150" },
  ];

  const contextValue = {
    currentChannel,
    setCurrentChannel,
    isMicrophoneOn,
    setIsMicrophoneOn,
    isHeadphonesOn,
    setIsHeadphonesOn,
    username,
    setUserName,
    currentServer,
    setCurrentServer,
    servers,
    setServers,
    addChannelToServer,
    isAuthenticated,
    setIsAuthenticated,
    registerUser,
    loginUser,
    isVideoOn,
    setIsVideoOn,
    participants,
    fullName,
    setFullName,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}
