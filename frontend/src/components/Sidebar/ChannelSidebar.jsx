import React, { useContext, useState } from "react";
import { GlobalContext } from "../../context/index.jsx";
import { useNavigate } from "react-router-dom";
import {
  faPlus,
  faVolumeUp,
  faHashtag,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "../../service/api";

export default function ChannelSidebar() {
  const {
    currentChannel,
    setCurrentChannel,
    currentServer,
    servers,
    addChannelToServer,
    setIsAuthenticated,
    fullName,
    host,
  } = useContext(GlobalContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
  const handleLogout = async () => {
    if (localStorage.getItem("isGuest") !== "true") {
      await api.put("/auth/status", {
        status: "offline",
      });
    }
    setDropdownOpen(false);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    localStorage.removeItem("isGuest");
    localStorage.removeItem("username");
    localStorage.removeItem("fullName");
    localStorage.removeItem("user_id");
    navigate("/login");
  };
  const handleChangeMode = async () => {
    if (localStorage.getItem("isGuest") !== "true") {
      await api.put("/auth/status", {
        status: isOnline ? "invisible" : "online",
      });
    }
    setIsOnline(!isOnline);
    setDropdownOpen(false);
  };

  const currentServerData = servers.find(
    (server) => server.id === currentServer
  );

  const handleAddChannel = (channelType) => {
    const channelName = prompt(`Enter new ${channelType} channel name:`);
    if (channelName) {
      addChannelToServer(currentServer, channelName, channelType);
    }
  };

  return (
    <div className="w-60 bg-gray-800 flex flex-col justify-between">
      <div>
        <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
          <h2 className="font-semibold text-white">
            {currentServerData?.name || "No Server"}
          </h2>
        </div>

        <div className="text-xs p-[10px] text-gray-400 px-2 mb-1 flex justify-between items-center">
          <p className="font-semibold">TEXT CHANNELS</p>
          {host.current === Number(localStorage.getItem("user_id")) && (
            <button
              className="text-gray-400 hover:text-white"
              onClick={() => handleAddChannel("text")}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          )}
        </div>
        <div className="space-y-1">
          {currentServerData?.channels
            ?.filter((channel) => channel.channel_type === "text")
            .map((channel) => (
              <div
                key={channel.id}
                onClick={() => setCurrentChannel(channel.id)}
                className={`flex items-center px-2 py-1 rounded cursor-pointer ${
                  currentChannel === channel.id
                    ? "bg-gray-700 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                <FontAwesomeIcon
                  icon={faHashtag}
                  className="text-gray-400 mr-2"
                />
                <span className="font-medium">{channel.name}</span>
              </div>
            ))}
        </div>

        <div className="text-xs p-[10px] text-gray-400 px-2 mt-4 mb-1 flex justify-between items-center">
          <p className="font-semibold">VOICE CHANNELS</p>
          {host.current === Number(localStorage.getItem("user_id")) && (
            <button
              className="text-gray-400 hover:text-white"
              onClick={() => handleAddChannel("voice")}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          )}
        </div>
        <div className="space-y-1">
          {currentServerData?.channels
            ?.filter((channel) => channel.channel_type === "voice")
            .map((channel) => (
              <div
                key={channel.id}
                onClick={() => setCurrentChannel(channel.id)}
                className={`flex items-center px-2 py-1 rounded cursor-pointer ${
                  currentChannel === channel.id
                    ? "bg-gray-700 text-white"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                <FontAwesomeIcon
                  icon={faVolumeUp}
                  className="text-gray-400 mr-2"
                />
                <span className="font-medium">{channel.name}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="h-14 flex items-center bg-[#242b37] px-[10px]">
        <div className="flex items-center space-x-2 w-full">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
            {fullName[0]}
          </div>
          <div className="flex-1 text-start">
            <div className="text-sm font-medium text-white">{fullName}</div>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-yellow-400"
                }`}
              ></span>
              <span>{isOnline ? "Online" : "Invisible"}</span>
            </div>
          </div>
          <div className="flex space-x-1">
            <div className="relative">
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <FontAwesomeIcon icon={faCog} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-20">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-600 hover:text-white"
                  >
                    Logout
                  </button>
                  {localStorage.getItem("isGuest") !== "true" && (
                    <button
                      onClick={handleChangeMode}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-600 hover:text-white"
                    >
                      {!isOnline ? "Online" : "Invisible"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
