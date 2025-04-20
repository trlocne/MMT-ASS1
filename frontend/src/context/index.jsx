import React, { createContext, useState, useEffect, useRef } from "react";
import { api } from "../service/api";
// Tạo Context
export const GlobalContext = createContext();

export default function GlobalState({ children }) {
  const [currentChannel, setCurrentChannel] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(
    localStorage.getItem("isGuest") ? true : false
  );
  // server_id: host_user_id
  const host = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("token") ? true : false
  );

  const [isShared, setIsShared] = useState(false);

  const [username, setUserName] = useState(
    localStorage.getItem("username") ? localStorage.getItem("username") : ""
  );
  const [fullName, setFullName] = useState(
    localStorage.getItem("fullName") ? localStorage.getItem("fullName") : ""
  );
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(0);
  const [isMemberListVisible, setIsMemberListVisible] = useState(false);

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
      fetchServers().then(() => {
        // Set first server as default when servers are loaded
        if (servers.length > 0) {
          setCurrentServer(servers[0].id);
          // Set first channel as default
          if (servers[0].channels && servers[0].channels.length > 0) {
            setCurrentChannel(servers[0].channels[0].id);
          }
        }
      });
    }
  }, [isAuthenticated]);

  // Effect to handle default channel selection when server changes
  useEffect(() => {
    const selectedServer = servers.find(
      (server) => server.id === currentServer
    );
    if (
      selectedServer &&
      selectedServer.channels &&
      selectedServer.channels.length > 0
    ) {
      setCurrentChannel(selectedServer.channels[0].id);
    }
  }, [currentServer, servers]);

  const addChannelToServer = async (serverId, channelName, channelType) => {
    try {
      const res = await api.post("/channels/create", {
        name: channelName,
        server_id: serverId,
        channel_type: channelType,
      });

      // Fetch updated server data to ensure synchronization
      const updatedServers = await api.get("/servers");
      setServers(updatedServers.data);
    } catch (error) {
      console.log(error);
    }
  };

  const loginGuest = async (username) => {
    try {
      const res = await api.post("/auth/login-guest", {
        username: username,
      });
      console.log(res.data);
      localStorage.setItem("username", username);
      localStorage.setItem("isGuest", true);
      setFullName(username);
      setIsAuthenticated(true);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("fullName", username);
      return { success: true, message: "Login successful" };
    } catch (error) {
      console.log(error);
      return { success: false, message: error.response.data.detail };
    }
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
      localStorage.setItem("user_id", userInfo.data.id);
      setFullName(userInfo.data.full_name);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("fullName", userInfo.data.full_name);
      return { success: true, message: "Login successful" };
    } catch (error) {
      console.log(error.response.data.detail);
      return { success: false, message: error.response.data.detail };
    }
  };

  const contextValue = {
    currentChannel,
    setCurrentChannel,
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
    fullName,
    setFullName,
    loginGuest,
    isGuestMode,
    setIsGuestMode,
    isShared,
    setIsShared,
    isMemberListVisible,
    setIsMemberListVisible,
    host,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}
