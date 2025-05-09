import React, { useContext, useState, useEffect } from "react";
import { GlobalContext } from "../../context/index.jsx";
import MessagesArea from "./MessagesArea";
import MessageInput from "./MessageInput";
import { api } from "../../service/api";
import VideoCallInterface from "../Modals/VideoCallInterface";

import {
  faSearch,
  faInbox,
  faHashtag,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import socketService from "../../service/socket";
import { v4 as uuidv4 } from "uuid";
export default function MainContent() {
  const {
    currentChannel,
    fullName,
    username,
    isGuestMode,
    setIsMemberListVisible,
  } = useContext(GlobalContext);
  const [currentChannelData, setCurrentChannelData] = useState(null);
  const [isVoiceChannel, setIsVoiceChannel] = useState(false);
  // when click on channel, fetch messages, and websocket to chat
  const fetchChannelData = async () => {
    try {
      const res = await api.get(`/channels/${currentChannel}/messages`);
      console.log(res.data);
      const isVoiceChannel = res.data.channel_type === "voice";
      setIsVoiceChannel(isVoiceChannel);
      setCurrentChannelData(res.data);
    } catch (error) {
      console.error("Error fetching channel data:", error);
    }
  };

  useEffect(() => {
    if (!currentChannel) return;
    fetchChannelData();

    // connect socket
    const token = localStorage.getItem("token");
    socketService.connectTextChat(currentChannel, token);
    // register callback
    socketService.on("onMessage", (message) => {
      if (message instanceof Blob) {
        const url = URL.createObjectURL(message);
        setCurrentChannelData((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), { type: "image", url }],
        }));
      } else {
        setCurrentChannelData((prev) => ({
          ...prev,
          messages: [...(prev?.messages || []), message],
        }));
      }
    });

    socketService.on("onError", () => {
      console.error("WebSocket connection failed");
    });
    // clean up
    return () => {
      socketService.disconnect("text");
    };
  }, [currentChannel]);

  const handleSendMessage = (newMessage) => {
    if (!newMessage.text.trim()) return;
    const messageData = {
      id: uuidv4(),
      content: newMessage.text,
      sender: {
        full_name: fullName,
        username: username,
      },
      created_at: newMessage.timestamp,
    };
    socketService.sendTextMessage(messageData);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-700">
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faHashtag} className="text-gray-400 mr-2" />
          <h2 className="font-semibold">{currentChannelData?.name}</h2>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white">
            <FontAwesomeIcon icon={faSearch} />
          </button>
          <button className="text-gray-400 hover:text-white">
            <FontAwesomeIcon icon={faInbox} />
          </button>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setIsMemberListVisible((prev) => !prev)}
          >
            <FontAwesomeIcon icon={faUsers} />
          </button>
        </div>
      </div>
      {/* Content */}
      {isVoiceChannel ? (
        <div className="flex-1 flex flex-row">
          {/* Bên trái: VideoCallInterface */}
          <div className="w-3/4 flex-shrink-0">
            <VideoCallInterface />
          </div>

          {/* Bên phải: MessagesArea và MessageInput */}
          <div className="w-1/4 flex flex-col">
            <MessagesArea messages={currentChannelData?.messages} />
            {!isGuestMode && <MessageInput onSendMessage={handleSendMessage} />}
          </div>
        </div>
      ) : (
        <>
          <MessagesArea messages={currentChannelData?.messages} />
          {!isGuestMode && <MessageInput onSendMessage={handleSendMessage} />}
        </>
      )}
    </div>
  );
}
