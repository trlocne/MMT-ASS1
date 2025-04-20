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
  faStopCircle,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import socketService from "../../service/socket";
import { v4 as uuidv4 } from "uuid";

export default function VideoCallInterface() {
  const { currentChannel, host } = useContext(GlobalContext);
  const [isVideoOn, setIsVideoOn] = useState(false);
  // const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  // const [isHeadphonesOn, setIsHeadphonesOn] = useState(true);
  const [peerId] = useState(uuidv4());
  const peersRef = useRef({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const [isSignalingReady, setIsSignalingReady] = useState(false);
  const [pinnedVideo, setPinnedVideo] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peersName, setPeersName] = useState({});

  const isHost =
    host && host.current === Number(localStorage.getItem("user_id"));

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ];

  useEffect(() => {
    if (!currentChannel || !isVideoOn || !localStream) return;

    console.log("Setting up signaling connection...");
    const token = localStorage.getItem("token");
    socketService.connectSignaling(currentChannel, peerId, token);

    socketService.on(
      "onMessage",
      async (message) => {
        const { action, peer_id, target_id, sdp, candidate } = message;

        if (action === "new_peer" && peer_id !== peerId) {
          setPeersName((prev) => ({
            ...prev,
            [peer_id]: message.fullname,
          }));

          console.log(`New peer joined: ${peer_id}`);
          createPeerConnection(peer_id);
          const offer = await peersRef.current[peer_id].createOffer();
          await peersRef.current[peer_id].setLocalDescription(offer);
          socketService.sendSignalingMessage({
            action: "offer",
            target_id: peer_id,
            fullname: localStorage.getItem("fullName"),
            sdp: offer,
          });
        } else if (action === "offer" && target_id === peerId) {
          console.log(`Received offer from: ${peer_id}`);
          console.log(message);
          setPeersName((prev) => ({
            ...prev,
            [peer_id]: message.fullname,
          }));
          if (!peersRef.current[peer_id]) createPeerConnection(peer_id);
          await peersRef.current[peer_id].setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
          const answer = await peersRef.current[peer_id].createAnswer();
          await peersRef.current[peer_id].setLocalDescription(answer);
          socketService.sendSignalingMessage({
            action: "answer",
            target_id: peer_id,
            sdp: answer,
          });
        } else if (action === "answer" && target_id === peerId) {
          console.log(`Received answer from: ${peer_id}`);
          await peersRef.current[peer_id].setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
        } else if (action === "end_call" && target_id === peerId) {
          console.log("Host đã kết thúc cuộc gọi cho tất cả mọi người");
          alert("Host đã kết thúc cuộc gọi");

          if (isSignalingReady) {
            socketService.disconnect("signaling");
            setIsSignalingReady(false);
          }
          if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
          }
          Object.values(peersRef.current).forEach((peer) => peer.close());
          peersRef.current = {};
          setRemoteStreams({});
          setPeersName({});
          setIsVideoOn(false);
          setIsScreenSharing(false);
        } else if (action === "screen_state_change" && target_id === peerId) {
          console.log(
            `Received screen state change from ${peer_id}: ${message.isScreenSharing}`
          );

          setRemoteStreams((prev) => {
            if (prev[peer_id]) {
              const updatedStream = prev[peer_id].clone();
              updatedStream.isScreenSharing = message.isScreenSharing;

              return {
                ...prev,
                [peer_id]: updatedStream,
              };
            }
            return prev;
          });
        } else if (action === "ice_candidate" && target_id === peerId) {
          console.log("Adding ICE candidate from ", peer_id);
          if (peersRef.current[peer_id]) {
            await peersRef.current[peer_id].addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } else {
            console.error(
              `Cannot add ICE candidate: no connection to peer ${peer_id}`
            );
          }
        } else if (action === "peer_left" && peer_id in peersRef.current) {
          console.log(`Peer left: ${peer_id}`);
          peersRef.current[peer_id].close();
          delete peersRef.current[peer_id];
          setPeersName((prev) => {
            const newPeers = { ...prev };
            delete newPeers[peer_id];
            return newPeers;
          });
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

    setIsSignalingReady(true);

    return () => {
      socketService.disconnect("signaling");
      setIsSignalingReady(false);
    };
  }, [currentChannel, isVideoOn, localStream, peerId]);

  useEffect(() => {
    if (!isSignalingReady) return;

    Object.keys(peersRef.current).forEach((remotePeerId) => {
      socketService.sendSignalingMessage({
        action: "screen_state_change",
        peer_id: peerId,
        target_id: remotePeerId,
        isScreenSharing: isScreenSharing,
      });
    });
  }, [isScreenSharing, isSignalingReady, peerId]);

  const createPeerConnection = async (peerId) => {
    console.log(`Creating peer connection for ${peerId}`);
    const peerConnection = new RTCPeerConnection({ iceServers });

    peersRef.current[peerId] = peerConnection;

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
      console.log(stream.getVideoTracks());
      console.log(`Received track from ${peerId}: ${event.track.kind}`);

      // Không cần phân biệt screen/camera stream nữa vì mỗi người dùng chỉ có một luồng video
      const streamKey = peerId;

      // Lưu stream vào remoteStreams
      setRemoteStreams((prev) => ({
        ...prev,
        [streamKey]: stream,
      }));

      // Gán stream vào video ref tương ứng
      if (remoteVideoRefs.current[streamKey]) {
        remoteVideoRefs.current[streamKey].srcObject = stream;
      } else {
        console.warn(`No video ref found for ${streamKey}`);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendSignalingMessage({
          action: "ice_candidate",
          target_id: peerId,
          candidate: event.candidate,
        });
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

    return peerConnection;
  };

  const handleVideoCall = async () => {
    if (!isVideoOn) {
      console.log("Starting video call...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setLocalStream(stream);
        setIsVideoOn(true);
      } catch (err) {
        console.error("Error accessing media:", err);
        alert("Cannot access camera/microphone. Please check permissions.");
      }
    } else {
      console.log("Stopping video call...");
      if (isHost && isSignalingReady) {
        console.log("Host đang kết thúc cuộc gọi cho tất cả người tham gia");
        Object.keys(peersRef.current).forEach((remotePeerId) => {
          socketService.sendSignalingMessage({
            action: "end_call",
            target_id: remotePeerId,
          });
        });
      }

      if (isSignalingReady) {
        socketService.disconnect("signaling");
        setIsSignalingReady(false);
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      Object.values(peersRef.current).forEach((peer) => peer.close());
      peersRef.current = {};
      setRemoteStreams({});
      setIsVideoOn(false);
      setIsScreenSharing(false);
    }
  };

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([streamKey, stream]) => {
      const videoEl = remoteVideoRefs.current[streamKey];
      if (videoEl && stream && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  useEffect(() => {
    if (pinnedVideo === "local" && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
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
    if (id !== "local" && !remoteStreams[id]) {
      console.error(`Cannot pin video: stream for ${id} not found`);
      return;
    }

    // Nếu đang pin video này rồi, hủy pin
    if (pinnedVideo === id) {
      setPinnedVideo(null);

      // Đảm bảo tất cả video được cập nhật ngay lập tức, không bị delay
      requestAnimationFrame(() => {
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        Object.entries(remoteStreams).forEach(([streamKey, stream]) => {
          const videoEl = remoteVideoRefs.current[streamKey];
          if (videoEl && stream) {
            videoEl.srcObject = stream;
          }
        });
      });
    } else {
      // Cập nhật trạng thái pin và đồng thời cập nhật video stream ngay lập tức
      setPinnedVideo(id);

      // Đảm bảo video được pin được cập nhật ngay lập tức
      requestAnimationFrame(() => {
        if (id === "local" && localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        } else if (remoteStreams[id]) {
          const videoEl = remoteVideoRefs.current[id];
          if (videoEl) {
            videoEl.srcObject = remoteStreams[id];
          }
        }
      });
    }
  };

  const handleScreenShare = async () => {
    if (!isVideoOn || !localStream) {
      alert("You need to enable video call before sharing screen");
      return;
    }

    if (!isHost) {
      alert("Only the host can share the screen");
      return;
    }

    try {
      if (!isScreenSharing) {
        console.log("Starting screen sharing...");

        if (localVideoRef.current) {
          const canvas = document.createElement("canvas");
          canvas.width = localVideoRef.current.videoWidth || 640;
          canvas.height = localVideoRef.current.videoHeight || 480;
          const ctx = canvas.getContext("2d");

          if (localVideoRef.current.videoWidth) {
            ctx.drawImage(
              localVideoRef.current,
              0,
              0,
              canvas.width,
              canvas.height
            );
          }

          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = "20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(
            "Starting screen share...",
            canvas.width / 2,
            canvas.height / 2
          );

          const stream = canvas.captureStream();
          localVideoRef.current.srcObject = stream;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor",
            logicalSurface: true,
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });

        localStream.getVideoTracks().forEach((track) => {
          console.log("Stopping camera track:", track.id);
          track.stop();
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) {
          throw new Error("Không thể lấy được video từ màn hình");
        }

        console.log("Screen track acquired:", {
          id: screenTrack.id,
          label: screenTrack.label,
          enabled: screenTrack.enabled,
        });

        screenTrack.onended = async () => {
          console.log("Screen sharing ended by browser UI");
          await stopScreenSharing();
        };

        const newStream = new MediaStream();
        localStream
          .getAudioTracks()
          .forEach((track) => newStream.addTrack(track));
        newStream.addTrack(screenTrack);

        console.log("Created new stream with screen track");

        setLocalStream(newStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }

        await Promise.all(
          Object.entries(peersRef.current).map(async ([remotePeerId, peer]) => {
            const senders = peer.getSenders();
            const videoSender = senders.find(
              (sender) => sender.track && sender.track.kind === "video"
            );

            try {
              if (videoSender) {
                console.log(
                  `Replacing video track for peer ${remotePeerId} with screen track`
                );
                await videoSender.replaceTrack(screenTrack);
                console.log(
                  `Track replacement successful for peer ${remotePeerId}`
                );
              } else {
                console.log(
                  `No video sender found for peer ${remotePeerId}, adding screen track`
                );
                peer.addTrack(screenTrack, newStream);
              }
              return true;
            } catch (err) {
              console.error(
                `Error updating track for peer ${remotePeerId}:`,
                err
              );
              return false;
            }
          })
        );

        setIsScreenSharing(true);
      } else {
        await stopScreenSharing();
      }
    } catch (err) {
      console.error("Error sharing screen:", err);
      alert("Cannot share screen. Please check permissions or try again.");
      try {
        await stopScreenSharing();
      } catch (e) {
        console.error("Error restoring camera after failed screen share:", e);
      }
    }
  };

  const stopScreenSharing = async () => {
    if (isScreenSharing) {
      console.log("Stopping screen sharing, restoring camera");

      try {
        if (localVideoRef.current) {
          const canvas = document.createElement("canvas");
          canvas.width = localVideoRef.current.videoWidth || 640;
          canvas.height = localVideoRef.current.videoHeight || 480;
          const ctx = canvas.getContext("2d");

          if (localVideoRef.current.videoWidth) {
            ctx.drawImage(
              localVideoRef.current,
              0,
              0,
              canvas.width,
              canvas.height
            );
          }

          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = "20px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(
            "Restoring camera...",
            canvas.width / 2,
            canvas.height / 2
          );

          const stream = canvas.captureStream();
          localVideoRef.current.srcObject = stream;
        }

        localStream.getVideoTracks().forEach((track) => {
          track.stop();
        });

        console.log("Getting new camera stream");
        const newCameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        });

        const newVideoTrack = newCameraStream.getVideoTracks()[0];
        console.log("New camera track:", {
          id: newVideoTrack.id,
          enabled: newVideoTrack.enabled,
          readyState: newVideoTrack.readyState,
        });

        const newStream = new MediaStream();
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach((track) => newStream.addTrack(track));
        newStream.addTrack(newVideoTrack);

        setLocalStream(newStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }

        await Promise.all(
          Object.values(peersRef.current).map(async (peer) => {
            try {
              const senders = peer.getSenders();
              const videoSender = senders.find(
                (sender) => sender.track && sender.track.kind === "video"
              );

              if (videoSender) {
                console.log(
                  "Replacing screen track with new camera track in RTC connection"
                );
                await videoSender.replaceTrack(newVideoTrack);
                console.log("Track replaced successfully");
                return true;
              } else {
                console.log("No video sender found, adding new camera track");
                peer.addTrack(newVideoTrack, newStream);
                return true;
              }
            } catch (err) {
              console.error("Error replacing track:", err);
              return false;
            }
          })
        );

        setIsScreenSharing(false);
      } catch (err) {
        console.error("Error restoring camera:", err);
        alert("Không thể khôi phục camera. Vui lòng tải lại trang và thử lại.");
      }
    }
  };

  return (
    <div className="flex flex-col bg-black text-white h-full relative">
      {isVideoOn ? (
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          {(() => {
            if (pinnedVideo) {
              return (
                <div className="h-full w-full">
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
                      <div className="absolute top-4 right-4 z-30">
                        <button
                          onClick={() => handlePinVideo("local")}
                          className="bg-gray-800 bg-opacity-70 rounded-full p-3 text-white hover:bg-gray-700"
                        >
                          <FontAwesomeIcon icon={faThumbtack} size="lg" />
                        </button>
                      </div>
                      <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-md bg-black bg-opacity-50 px-4 py-2 rounded-lg z-30">
                        You (Fullscreen)
                        {isScreenSharing && (
                          <span className="text-green-400">(Screen)</span>
                        )}
                      </p>
                      {isScreenSharing === null && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white">Processing...</span>
                        </div>
                      )}
                    </div>
                  ) : remoteStreams[pinnedVideo] ? (
                    <div className="relative text-center bg-gray-800 h-full w-full">
                      <video
                        ref={(el) => {
                          if (
                            el &&
                            (!remoteVideoRefs.current[pinnedVideo] ||
                              remoteVideoRefs.current[pinnedVideo] !== el)
                          ) {
                            remoteVideoRefs.current[pinnedVideo] = el;
                            // Đảm bảo cập nhật source ngay lập tức
                            el.srcObject = remoteStreams[pinnedVideo];
                          }
                        }}
                        autoPlay
                        playsInline
                        controls={false}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 z-30">
                        <button
                          onClick={() => handlePinVideo(pinnedVideo)}
                          className="bg-gray-800 bg-opacity-70 rounded-full p-3 text-white hover:bg-gray-700"
                        >
                          <FontAwesomeIcon icon={faThumbtack} size="lg" />
                        </button>
                      </div>
                      <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-md bg-black bg-opacity-50 px-4 py-2 rounded-lg z-30">
                        {peersName[pinnedVideo] || pinnedVideo} (Fullscreen)
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-gray-800">
                      <p className="text-xl text-white mb-4">
                        Video not found, please select another video
                      </p>
                      <button
                        onClick={() => setPinnedVideo(null)}
                        className="px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 text-lg"
                      >
                        Back to grid mode
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            const totalParticipants =
              Object.keys(remoteStreams).length + (localStream ? 1 : 0);
            let gridClass = "grid gap-4 auto-rows-fr";
            if (totalParticipants <= 4) {
              gridClass += " grid-cols-2";
            } else if (totalParticipants <= 9) {
              gridClass += " grid-cols-3";
            } else if (totalParticipants <= 16) {
              gridClass += " grid-cols-4";
            } else {
              gridClass += " grid-cols-5";
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
                      You{" "}
                      {isScreenSharing && (
                        <span className="text-green-400">(Screen)</span>
                      )}
                    </p>
                    {isScreenSharing === null && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white">Processing...</span>
                      </div>
                    )}
                  </div>
                )}
                {Object.entries(remoteStreams).map(([streamKey, stream]) => (
                  <div
                    key={streamKey}
                    className="relative text-center bg-gray-800 rounded-xl overflow-hidden shadow-lg aspect-video"
                  >
                    <video
                      ref={(el) => {
                        if (
                          el &&
                          (!remoteVideoRefs.current[streamKey] ||
                            remoteVideoRefs.current[streamKey] !== el)
                        ) {
                          remoteVideoRefs.current[streamKey] = el;
                          // Đảm bảo cập nhật source ngay lập tức
                          el.srcObject = stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      controls={false}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => handlePinVideo(streamKey)}
                        className="bg-gray-800 bg-opacity-70 rounded-full p-2 text-white hover:bg-gray-700"
                      >
                        <FontAwesomeIcon icon={faThumbtack} />
                      </button>
                    </div>
                    <p className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-sm bg-black bg-opacity-50 px-2 py-1 rounded-lg">
                      {peersName[streamKey] || streamKey}{" "}
                      {stream.isScreenSharing && (
                        <span className="text-green-400">(Screen)</span>
                      )}
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
        {/* <ControlButton
          isActive={isMicrophoneOn}
          onClick={() => setIsMicrophoneOn((prev) => !prev)}
          activeIcon={faMicrophone}
          inactiveIcon={faMicrophoneSlash}
        /> */}
        {/* <ControlButton
          isActive={isHeadphonesOn}
          onClick={() => setIsHeadphonesOn((prev) => !prev)}
          activeIcon={faHeadphones}
          inactiveIcon={faVolumeMute}
        /> */}
        {/* <StaticButton icon={faVideo} /> */}
        <ControlButton
          isActive={!isScreenSharing}
          onClick={handleScreenShare}
          activeIcon={faDesktop}
          inactiveIcon={faStopCircle}
          disabled={!isVideoOn || !isHost}
          tooltip={!isHost ? "Only host can share screen" : ""}
        />
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

function ControlButton({
  isActive,
  onClick,
  activeIcon,
  inactiveIcon,
  disabled = false,
  tooltip = "",
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
          disabled
            ? "bg-gray-600 opacity-50 cursor-not-allowed"
            : isActive
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {disabled && !isActive ? (
          <FontAwesomeIcon icon={faLock} />
        ) : (
          <FontAwesomeIcon icon={isActive ? activeIcon : inactiveIcon} />
        )}
      </button>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
          <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            {tooltip}
          </div>
        </div>
      )}
    </div>
  );
}

function StaticButton({ icon }) {
  return (
    <button className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition">
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}
