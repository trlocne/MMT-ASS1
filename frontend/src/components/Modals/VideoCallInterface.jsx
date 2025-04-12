import React, { useContext, useState, useEffect, useRef } from "react";
import { GlobalContext } from "../../context/index.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faDesktop,
  faEllipsisH,
  faPhoneSlash,
  faHeadphones,
  faVolumeMute,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import socketService from "../../service/socket";
import { v4 as uuidv4 } from "uuid";

export default function VideoCallInterface() {
  const { currentChannel } = useContext(GlobalContext);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [isHeadphonesOn, setIsHeadphonesOn] = useState(true);
  const [peerId] = useState(uuidv4());
  const peersRef = useRef({}); // Thay vì useState
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    }, // TURN miễn phí
  ];

  useEffect(() => {
    if (!currentChannel || !isVideoOn) return;

    const token = localStorage.getItem("token");
    socketService.connectSignaling(currentChannel, peerId, token);

    socketService.on(
      "onMessage",
      async (message) => {
        console.log(`Received message:`, message);
        const { action, peer_id, target_id, sdp, candidate } = message;

        if (action === "new_peer" && peer_id !== peerId) {
          createPeerConnection(peer_id);
          const offer = await peersRef.current[peer_id].createOffer();
          await peersRef.current[peer_id].setLocalDescription(offer);
          const res = { action: "offer", target_id: peer_id, sdp: offer };
          console.log("Send message: ", res);
          socketService.sendSignalingMessage(res);
        } else if (action === "offer" && target_id === peerId) {
          if (!peersRef.current[peer_id]) createPeerConnection(peer_id);
          await peersRef.current[peer_id].setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
          const answer = await peersRef.current[peer_id].createAnswer();
          await peersRef.current[peer_id].setLocalDescription(answer);
          const res = { action: "answer", target_id: peer_id, sdp: answer };
          console.log("Send message: ", res);
          socketService.sendSignalingMessage(res);
        } else if (action === "answer" && target_id === peerId) {
          try {
            const peerConnection = peersRef.current[peer_id];
            if (peerConnection) {
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(sdp)
              );
              console.log("SetRemoteDescription Done!");
            } else {
              console.error(`No peer connection found for ${peer_id}`);
            }
          } catch (error) {
            console.error("Error setting remote description: ", error);
          }
        } else if (action === "ice_candidate" && target_id === peerId) {
          console.log("Adding ICE candidate from ", peer_id);
          const peerConnection = peersRef.current[peer_id];
          if (peerConnection) {
            try {
              await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
              console.log(`ICE candidate added successfully for ${peer_id}`);
            } catch (err) {
              console.error(`Error adding ICE candidate for ${peer_id}:`, err);
            }
          } else {
            console.error(
              `Cannot add ICE candidate: No peer connection for ${peer_id}`
            );
          }
        } else if (action === "peer_left" && peer_id in peersRef.current) {
          peersRef.current[peer_id].close();
          delete peersRef.current[peer_id];
          setRemoteStreams((prev) => {
            const newStreams = { ...prev };
            delete newStreams[peer_id];
            return newStreams;
          });
        }
      },
      "signaling"
    );

    socketService.sendSignalingMessage({
      action: "join_voice",
      peer_id: peerId,
      channel_id: currentChannel,
    });

    return () => socketService.disconnect("signaling");
  }, [currentChannel, isVideoOn, peerId]);

  const createPeerConnection = async (peerId) => {
    const peerConnection = new RTCPeerConnection({ iceServers });

    peersRef.current[peerId] = peerConnection; // Lưu vào ref

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log(`Adding track to ${peerId}: ${track.kind}`);
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      // Gán stream vào ref để video hiển thị (và phát tiếng)
      setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
      if (remoteVideoRefs.current[peerId]) {
        remoteVideoRefs.current[peerId].srcObject = stream;
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${peerId}:`, event.candidate);
        socketService.sendSignalingMessage({
          action: "ice_candidate",
          target_id: peerId,
          candidate: event.candidate,
        });
      } else {
        console.log(`ICE gathering completed for ${peerId}`);
      }
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log(
        `ICE gathering state for ${peerId}: ${peerConnection.iceGatheringState}`
      );
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Connection state with ${peerId}: ${peerConnection.connectionState}`
      );
    };
  };

  const handleVideoCall = async () => {
    setIsVideoOn((prev) => {
      console.log(`isVideoOn changing from ${prev} to ${!prev}`);
      return !prev;
    });
    if (!isVideoOn) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("WebRTC không được hỗ trợ hoặc yêu cầu HTTPS/localhost.");
        alert(
          "Trình duyệt không hỗ trợ video call hoặc cần chạy trên HTTPS/localhost."
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setLocalStream(stream);
      } catch (err) {
        console.error("Lỗi khi lấy media:", err);
        alert("Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền.");
      }
    } else {
      console.log("Closing peers and stopping local stream");
      localStream?.getTracks().forEach((track) => track.stop());
      setLocalStream(null);

      // Properly close all peer connections
      Object.values(peersRef.current).forEach((peer) => peer.close());
      peersRef.current = {};
      setRemoteStreams({});
    }
  };

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOn]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      const videoEl = remoteVideoRefs.current[peerId];
      if (videoEl && stream && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  return (
    <div className="flex flex-col bg-black text-white">
      {isVideoOn ? (
        <div className="flex-1 h-[350px] grid grid-cols-2 gap-4 p-4">
          {localStream && (
            <div className="relative text-center bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                controls={false}
                className="w-full h-50 object-cover"
              />
              <p className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded-lg">
                You
              </p>
            </div>
          )}
          {Object.entries(remoteStreams).map(([peerId, stream]) => (
            <div
              key={peerId}
              className="relative text-center bg-gray-800 rounded-xl overflow-hidden shadow-lg"
            >
              <video
                ref={(el) => {
                  if (el) {
                    remoteVideoRefs.current[peerId] = el;
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
                controls={false}
                className="w-full h-40 object-cover"
              />
              <p className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded-lg">
                {peerId}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div></div>
      )}
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
          onClick={handleVideoCall}
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
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-red-600 hover:bg-red-700"
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
