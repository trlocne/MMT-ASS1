import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faDesktop,
  faEllipsisH,
  faPhoneSlash,
  faHeadphones,
  faVolumeMute,
  faPhone
  // faHeadphonesSlash,
} from '@fortawesome/free-solid-svg-icons';
import { GlobalContext } from '../../context/index.jsx';
import { useContext } from 'react';

export default function VideoCallInterface() {
  const {
    isMicrophoneOn,
    setIsMicrophoneOn,
    isHeadphonesOn,
    setIsHeadphonesOn,
    isVideoOn, 
    setIsVideoOn,
    participants
  } = useContext(GlobalContext);

  return (
    <div className="flex flex-col bg-black text-white">
      {isVideoOn ? 
      <div className="flex-1 h-[350px] grid grid-cols-2 gap-4 p-4">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="relative text-center bg-gray-800 rounded-xl overflow-hidden shadow-lg"
          >
            <img
              src={participant.avatar || "https://via.placeholder.com/150"}
              alt={`${participant.name} Video`}
              className="w-full h-40 object-cover"
            />
            <p className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded-lg">
              {participant.name}
            </p>
          </div>
        ))}
      </div> : <div></div> }

      <div className="flex items-center justify-center space-x-4 py-4 bg-[#242b37]">
        <ControlButton
          isActive={isMicrophoneOn}
          onClick={() => setIsMicrophoneOn((prev) => !prev)}
          activeIcon={faMicrophone}
          inactiveIcon={faMicrophoneSlash}
        />

        <ControlButton
          isActive={isHeadphonesOn}
          onClick={() => setIsHeadphonesOn((prev) => !prev)}
          activeIcon={faHeadphones}
          inactiveIcon={faVolumeMute}
        />

        <StaticButton icon={faVideo} />
        <StaticButton icon={faDesktop} />
        <StaticButton icon={faEllipsisH} />

        <ControlButton
          isActive={!isVideoOn}
          onClick={() => setIsVideoOn((prev) => !prev)}
          activeIcon={faPhone}
          inactiveIcon={faPhoneSlash}
        />
      </div>
    </div>
  );
}

function ControlButton({ isActive, onClick, activeIcon, inactiveIcon }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
        isActive
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-red-600 hover:bg-red-700'
      }`}
    >
      <FontAwesomeIcon icon={isActive ? activeIcon : inactiveIcon} />
    </button>
  );
}


function StaticButton({ icon }) {
  return (
    <button className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition">
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}
