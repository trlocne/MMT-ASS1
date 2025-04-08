import React, { useContext } from 'react';
import { GlobalContext } from '../../context/index.jsx';
import {
  faPlus,
  faVolumeUp,
  faHashtag,
  faMicrophone,
  faMicrophoneSlash,
  faHeadphones,
  faVolumeMute,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function ChannelSidebar() {
  const {
    currentChannel,
    setCurrentChannel,
    isMicrophoneOn,
    setIsMicrophoneOn,
    isHeadphonesOn,
    setIsHeadphonesOn,
    currentServer,
    servers,
    addChannelToServer,
    username
  } = useContext(GlobalContext);
  

  const currentServerData = servers.find((server) => server.id === currentServer);

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
          <h2 className="font-semibold text-white">{currentServerData?.name || 'No Server'}</h2>
        </div>

        <div className="text-xs p-[10px] text-gray-400 px-2 mb-1 flex justify-between items-center">
          <p className="font-semibold">TEXT CHANNELS</p>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => handleAddChannel('text')}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className="space-y-1">
          {currentServerData?.textChannels.map((channel) => (
            <div
              key={channel}
              onClick={() => setCurrentChannel(channel)}
              className={`flex items-center px-2 py-1 rounded cursor-pointer ${
                currentChannel === channel
                  ? 'bg-gray-700 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faHashtag} className="text-gray-400 mr-2" />
              <span className="font-medium">{channel}</span>
            </div>
          ))}
        </div>

        <div className="text-xs p-[10px] text-gray-400 px-2 mt-4 mb-1 flex justify-between items-center">
          <p className="font-semibold">VOICE CHANNELS</p>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => handleAddChannel('voice')}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className="space-y-1">
          {currentServerData?.voiceChannels.map((channel) => (
            <div
              key={channel}
              onClick={() => setCurrentChannel(channel)}
              className={`flex items-center px-2 py-1 rounded cursor-pointer ${
                currentChannel === channel
                  ? 'bg-gray-700 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faVolumeUp} className="text-gray-400 mr-2" />
              <span className="font-medium">{channel}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-14 flex items-center bg-[#242b37] px-[10px]">
        <div className="flex items-center space-x-2 w-full">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
            {username[0]}
          </div>
          <div className="flex-1 text-start">
            <div className="text-sm font-medium text-white">{username}</div>
            <div className="text-xs text-gray-400">Online</div>
          </div>
          <div className="flex space-x-1">
            <button
              className={`${
                isMicrophoneOn ? 'text-gray-400 hover:text-white' : 'text-red-500'
              }`}
              onClick={() => setIsMicrophoneOn((prev) => !prev)}
            >
              <FontAwesomeIcon icon={isMicrophoneOn ? faMicrophone : faMicrophoneSlash} />
            </button>

            <button
              className={`${
                isHeadphonesOn ? 'text-gray-400 hover:text-white' : 'text-red-500'
              }`}
              onClick={() => setIsHeadphonesOn((prev) => !prev)}
            >
              <FontAwesomeIcon icon={isHeadphonesOn ? faHeadphones : faVolumeMute} />
            </button>

            <button className="text-gray-400 hover:text-white">
              <FontAwesomeIcon icon={faCog} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}