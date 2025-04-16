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
  faThumbtack,
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
  const [isSignalingReady, setIsSignalingReady] = useState(false);
  const [pinnedVideo, setPinnedVideo] = useState(null); // null hoặc 'local' hoặc peerId

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    }, // TURN miễn phí
  ];

  // Thiết lập kết nối signaling khi có stream
  useEffect(() => {
    if (!currentChannel || !isVideoOn || !localStream) return;

    console.log(
      "Setting up signaling connection with local stream available..."
    );

    const token = localStorage.getItem("token");
    socketService.connectSignaling(currentChannel, peerId, token);

    console.log("Socket service connected with peerId:", peerId);

    socketService.on(
      "onMessage",
      async (message) => {
        console.log(`Received message:`, message);
        const { action, peer_id, target_id, sdp, candidate } = message;

        if (action === "new_peer" && peer_id !== peerId) {
          console.log(`New peer joined: ${peer_id}, creating connection`);
          createPeerConnection(peer_id);
          const offer = await peersRef.current[peer_id].createOffer();
          await peersRef.current[peer_id].setLocalDescription(offer);
          const res = { action: "offer", target_id: peer_id, sdp: offer };
          console.log("Sending offer to new peer: ", res);
          socketService.sendSignalingMessage(res);
        } else if (action === "offer" && target_id === peerId) {
          console.log(`Received offer from: ${peer_id}`);
          if (!peersRef.current[peer_id]) createPeerConnection(peer_id);
          await peersRef.current[peer_id].setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
          const answer = await peersRef.current[peer_id].createAnswer();
          await peersRef.current[peer_id].setLocalDescription(answer);
          const res = { action: "answer", target_id: peer_id, sdp: answer };
          console.log("Sending answer: ", res);
          socketService.sendSignalingMessage(res);
        } else if (action === "answer" && target_id === peerId) {
          try {
            console.log(`Received answer from: ${peer_id}`);
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
          console.log("Adding ICE candidate from ", peer_id, candidate);
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
          console.log(`Peer left: ${peer_id}`);
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

    console.log(
      `Joining voice channel: ${currentChannel} with peerId: ${peerId}`
    );
    socketService.sendSignalingMessage({
      action: "join_voice",
      peer_id: peerId,
      channel_id: currentChannel,
    });

    setIsSignalingReady(true);

    return () => {
      console.log("Disconnecting from signaling server");
      socketService.disconnect("signaling");
      setIsSignalingReady(false);
    };
  }, [currentChannel, isVideoOn, peerId, localStream]);

  const createPeerConnection = async (peerId) => {
    console.log(`Creating peer connection for ${peerId} with config:`, {
      iceServers,
    });

    const peerConnection = new RTCPeerConnection({ iceServers });

    peersRef.current[peerId] = peerConnection; // Lưu vào ref

    console.log(`Peer connection created: ${peerId}`, peersRef.current);

    if (localStream) {
      console.log(
        `Adding ${localStream.getTracks().length} tracks to peer ${peerId}`
      );
      localStream.getTracks().forEach((track) => {
        console.log(`Adding track to ${peerId}: ${track.kind}`);
        peerConnection.addTrack(track, localStream);
      });
    } else {
      console.warn(
        `No local stream available when creating peer connection for ${peerId}`
      );
    }

    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      console.log(`Received track from ${peerId}: ${event.track.kind}`);
      // Gán stream vào ref để video hiển thị (và phát tiếng)
      setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
      if (remoteVideoRefs.current[peerId]) {
        remoteVideoRefs.current[peerId].srcObject = stream;
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Generated ICE candidate for ${peerId}:`, event.candidate);
        socketService.sendSignalingMessage({
          action: "ice_candidate",
          target_id: peerId,
          candidate: event.candidate,
        });
        console.log(`ICE candidate sent to ${peerId}`);
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

    peerConnection.onsignalingstatechange = () => {
      console.log(
        `Signaling state with ${peerId}: ${peerConnection.signalingState}`
      );
    };

    peerConnection.onicecandidateerror = (event) => {
      console.error(`ICE candidate error for ${peerId}:`, event);
    };

    return peerConnection;
  };

  const handleVideoCall = async () => {
    if (!isVideoOn) {
      // Bật video call
      console.log("Starting video call...");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("WebRTC không được hỗ trợ hoặc yêu cầu HTTPS/localhost.");
        alert(
          "Trình duyệt không hỗ trợ video call hoặc cần chạy trên HTTPS/localhost."
        );
        return;
      }

      try {
        console.log("Getting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        console.log("User media acquired:", stream);
        setLocalStream(stream);

        // Chỉ bật video call sau khi đã có stream
        setIsVideoOn(true);
      } catch (err) {
        console.error("Lỗi khi lấy media:", err);
        alert("Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền.");
      }
    } else {
      // Tắt video call
      console.log("Stopping video call...");

      // Ngắt kết nối signaling
      if (isSignalingReady) {
        console.log("Disconnecting from signaling server");
        socketService.disconnect("signaling");
        setIsSignalingReady(false);
      }

      // Dừng stream và đóng các kết nối
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
        setLocalStream(null);
      }

      // Đóng tất cả peer connections
      Object.entries(peersRef.current).forEach(([id, peer]) => {
        console.log(`Closing peer connection: ${id}`);
        peer.close();
      });
      peersRef.current = {};
      setRemoteStreams({});

      // Tắt video call
      setIsVideoOn(false);
    }
  };

  // Hiển thị local stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Hiển thị remote streams và đảm bảo không reset khi re-render
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      const videoEl = remoteVideoRefs.current[peerId];
      if (videoEl && stream && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  // Đảm bảo các tham chiếu video được giữ nguyên ngay cả khi ghim video
  useEffect(() => {
    // Xử lý cho video local được ghim
    if (pinnedVideo === "local" && localStream && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }

    // Xử lý cho video remote được ghim
    if (pinnedVideo && pinnedVideo !== "local" && remoteStreams[pinnedVideo]) {
      const pinnedVideoEl = remoteVideoRefs.current[pinnedVideo];
      if (
        pinnedVideoEl &&
        pinnedVideoEl.srcObject !== remoteStreams[pinnedVideo]
      ) {
        pinnedVideoEl.srcObject = remoteStreams[pinnedVideo];
      }
    }
  }, [pinnedVideo, remoteStreams, localStream]);

  const handlePinVideo = (id) => {
    // Kiểm tra xác nhận video remote tồn tại trước khi pin
    if (id !== "local" && !remoteStreams[id]) {
      console.error(`Cannot pin video: stream for ${id} not found`);
      return;
    }

    // Nếu click vào video đã được pin, bỏ pin
    if (pinnedVideo === id) {
      setPinnedVideo(null);

      // Đảm bảo các video được hiển thị lại đúng sau khi unpin
      setTimeout(() => {
        // Đặt lại video local
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Đặt lại tất cả video remote
        Object.entries(remoteStreams).forEach(([peerId, stream]) => {
          const videoEl = remoteVideoRefs.current[peerId];
          if (videoEl && stream) {
            videoEl.srcObject = stream;
          }
        });
      }, 50); // Đợi một chút để DOM cập nhật
    } else {
      setPinnedVideo(id);
    }
  };

  // Thêm useEffect để đảm bảo video hiển thị lại đúng khi chuyển từ chế độ pinned sang grid
  useEffect(() => {
    if (!pinnedVideo) {
      // Trường hợp vừa bỏ ghim
      // Cập nhật lại tất cả video để đảm bảo hiển thị
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      Object.entries(remoteStreams).forEach(([peerId, stream]) => {
        const videoEl = remoteVideoRefs.current[peerId];
        if (videoEl && stream) {
          videoEl.srcObject = stream;
        }
      });
    }
  }, [pinnedVideo, localStream, remoteStreams]);

  return (
    <div className="flex flex-col bg-black text-white h-full relative">
      {isVideoOn ? (
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {(() => {
            // Nếu có video được pin
            if (pinnedVideo) {
              return (
                <div className="h-full w-full">
                  {/* Video được pin chiếm toàn bộ màn hình */}
                  {pinnedVideo === "local" ? (
                    <div className="relative text-center bg-gray-800 h-full w-full">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        controls={false}
                        muted={true}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={() => handlePinVideo("local")}
                          className="bg-gray-800 bg-opacity-70 rounded-full p-3 text-white hover:bg-gray-700"
                        >
                          <FontAwesomeIcon icon={faThumbtack} size="lg" />
                        </button>
                      </div>
                      <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-md bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                        You (Fullscreen)
                      </p>
                    </div>
                  ) : remoteStreams[pinnedVideo] ? (
                    <div className="relative text-center bg-gray-800 h-full w-full">
                      <video
                        ref={(el) => {
                          // Chỉ cập nhật tham chiếu khi cần thiết
                          if (
                            el &&
                            (!remoteVideoRefs.current[pinnedVideo] ||
                              remoteVideoRefs.current[pinnedVideo] !== el)
                          ) {
                            remoteVideoRefs.current[pinnedVideo] = el;
                            // Chỉ đặt srcObject nếu chưa được đặt
                            if (el.srcObject !== remoteStreams[pinnedVideo]) {
                              el.srcObject = remoteStreams[pinnedVideo];
                            }
                          }
                        }}
                        autoPlay
                        playsInline
                        controls={false}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={() => handlePinVideo(pinnedVideo)}
                          className="bg-gray-800 bg-opacity-70 rounded-full p-3 text-white hover:bg-gray-700"
                        >
                          <FontAwesomeIcon icon={faThumbtack} size="lg" />
                        </button>
                      </div>
                      <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-md bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                        {pinnedVideo} (Fullscreen)
                      </p>
                    </div>
                  ) : (
                    // Hiển thị thông báo nếu không tìm thấy stream
                    <div className="flex flex-col items-center justify-center h-full bg-gray-800">
                      <p className="text-xl text-white mb-4">
                        Không tìm thấy video, vui lòng chọn video khác
                      </p>
                      <button
                        onClick={() => setPinnedVideo(null)}
                        className="px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 text-lg"
                      >
                        Quay lại chế độ grid
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // Nếu không có video nào được pin, hiển thị grid bình thường
            const totalParticipants =
              Object.keys(remoteStreams).length + (localStream ? 1 : 0);
            let gridClass = "grid gap-4 auto-rows-fr";

            if (totalParticipants <= 4) {
              gridClass += " grid-cols-2"; // Grid 2x2
            } else if (totalParticipants <= 9) {
              gridClass += " grid-cols-3"; // Grid 3x3
            } else if (totalParticipants <= 16) {
              gridClass += " grid-cols-4"; // Grid 4x4
            } else {
              gridClass += " grid-cols-5"; // Grid 5x5 cho số lượng lớn hơn
            }

            return (
              <div className={gridClass}>
                {localStream && (
                  <div className="relative text-center bg-gray-800 rounded-xl overflow-hidden shadow-lg aspect-video">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      controls={false}
                      muted={true}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => handlePinVideo("local")}
                        className="bg-gray-800 bg-opacity-70 rounded-full p-2 text-white hover:bg-gray-700"
                      >
                        <FontAwesomeIcon icon={faThumbtack} />
                      </button>
                    </div>
                    <p className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded-lg">
                      You
                    </p>
                  </div>
                )}
                {Object.entries(remoteStreams).map(([peerId, stream]) => (
                  <div
                    key={peerId}
                    className="relative text-center bg-gray-800 rounded-xl overflow-hidden shadow-lg aspect-video"
                  >
                    <video
                      ref={(el) => {
                        // Chỉ cập nhật tham chiếu và srcObject khi cần thiết
                        if (
                          el &&
                          (!remoteVideoRefs.current[peerId] ||
                            remoteVideoRefs.current[peerId] !== el)
                        ) {
                          remoteVideoRefs.current[peerId] = el;
                          // Chỉ đặt srcObject nếu chưa được đặt hoặc khác
                          if (el.srcObject !== stream) {
                            el.srcObject = stream;
                          }
                        }
                      }}
                      autoPlay
                      playsInline
                      controls={false}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => handlePinVideo(peerId)}
                        className="bg-gray-800 bg-opacity-70 rounded-full p-2 text-white hover:bg-gray-700"
                      >
                        <FontAwesomeIcon icon={faThumbtack} />
                      </button>
                    </div>
                    <p className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded-lg">
                      {peerId}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="flex-1"></div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center space-x-4 py-4 bg-[#242b37] bg-opacity-90">
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
