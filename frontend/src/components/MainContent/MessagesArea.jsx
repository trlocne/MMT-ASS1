import React, { useEffect, useRef, useState } from "react";

export default function MessagesArea({ messages }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      setShouldAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [messages, shouldAutoScroll]);

  return (
    <div
      id="messages-container"
      className="flex-1 overflow-y-auto space-y-4"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <div className="px-4 pt-4">
        {messages?.map((message) => (
          <Message
            key={message?.id}
            user={message?.sender?.full_name}
            text={message?.content}
            timestamp={message?.created_at}
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
