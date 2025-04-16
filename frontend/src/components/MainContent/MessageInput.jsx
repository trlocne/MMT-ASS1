import React, { useState, useContext } from "react";
import { GlobalContext } from "../../context/index.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

export default function MessageInput({ onSendMessage }) {
  const [message, setMessage] = useState("");
  const { currentChannel, fullName } = useContext(GlobalContext);

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        user: fullName,
        text: message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      onSendMessage(newMessage);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="p-4">
      <div className="bg-gray-600 rounded-lg px-4 py-2 flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message #${currentChannel}`}
          className="bg-transparent flex-1 outline-none text-gray-100 placeholder-gray-400"
        />
        {message.trim() && (
          <button
            onClick={handleSend}
            className="ml-2 text-gray-400 hover:text-white"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        )}
      </div>
    </div>
  );
}
