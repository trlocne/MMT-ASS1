import React from 'react'

export default function ChannelHeader({ currentChannel }) {
    return (
      <div className="h-12 border-b border-gray-900 flex items-center px-4 shadow-sm">
        <i className="fas fa-hashtag text-gray-400 mr-2"></i>
        <h2 className="font-semibold">{currentChannel}</h2>
      </div>
    );
  }