// const SOCKET_URL = "wss://127.0.0.1:8000/ws/";
// const SOCKET_URL = "wss://10.88.54.73:8000/ws/";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "wss://127.0.0.1:8000/ws/";

class SocketService {
  constructor() {
    this.textSocket = null;
    this.signalingSocket = null;
    this.textCallbacks = {};
    this.signalingCallbacks = {};
  }

  connectTextChat(channelId, token = null) {
    if (this.textSocket) {
      this.textSocket.close();
    }
    const wsUrl = token
      ? `${SOCKET_URL}${channelId}?token=${token}`
      : `${SOCKET_URL}${channelId}`;
    this.textSocket = new WebSocket(wsUrl);

    this.textSocket.onopen = () => {
      console.log(`Text WebSocket connected to channel ${channelId}`);
      if (this.textCallbacks.onOpen) this.textCallbacks.onOpen();
    };

    this.textSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (this.textCallbacks.onMessage) this.textCallbacks.onMessage(message);
    };

    this.textSocket.onerror = (error) => {
      console.error("Text WebSocket error:", error);
      if (this.textCallbacks.onError) this.textCallbacks.onError(error);
    };

    this.textSocket.onclose = () => {
      console.log("Text WebSocket disconnected");
      if (this.textCallbacks.onClose) this.textCallbacks.onClose();
    };
  }

  sendImage(imageBlob) {
    if (this.textSocket && this.textSocket.readyState === WebSocket.OPEN) {
      this.textSocket.send(imageBlob);
    }
  }

  connectSignaling(channelId, peerId, token = null) {
    if (this.signalingSocket) {
      this.signalingSocket.close();
    }
    const wsUrl = token
      ? `${SOCKET_URL}${channelId}/signaling?peer_id=${peerId}&token=${token}`
      : `${SOCKET_URL}${channelId}/signaling?peer_id=${peerId}`;
    this.signalingSocket = new WebSocket(wsUrl);

    this.signalingSocket.onopen = () => {
      console.log(`Signaling WebSocket connected with peerId ${peerId}`);
      if (this.signalingCallbacks.onOpen) this.signalingCallbacks.onOpen();
    };

    this.signalingSocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (this.signalingCallbacks.onMessage)
        this.signalingCallbacks.onMessage(message);
    };

    this.signalingSocket.onerror = (error) => {
      console.error("Signaling WebSocket error:", error);
      if (this.signalingCallbacks.onError)
        this.signalingCallbacks.onError(error);
    };

    this.signalingSocket.onclose = () => {
      console.log("Signaling WebSocket disconnected");
      if (this.signalingCallbacks.onClose) this.signalingCallbacks.onClose();
    };
  }

  sendTextMessage(message) {
    console.log("Sending text message:", message);
    if (this.textSocket && this.textSocket.readyState === WebSocket.OPEN) {
      this.textSocket.send(JSON.stringify(message));
    }
  }

  sendSignalingMessage(message) {
    if (
      this.signalingSocket &&
      this.signalingSocket.readyState === WebSocket.OPEN
    ) {
      this.signalingSocket.send(JSON.stringify(message));
    }
  }

  on(event, callback, type = "text") {
    if (type === "text") {
      this.textCallbacks[event] = callback;
    } else if (type === "signaling") {
      this.signalingCallbacks[event] = callback;
    }
  }

  disconnect(type = "all") {
    if (type === "text" || type === "all") {
      if (this.textSocket) {
        this.textSocket.close();
        this.textSocket = null;
      }
    }
    if (type === "signaling" || type === "all") {
      if (this.signalingSocket) {
        this.signalingSocket.close();
        this.signalingSocket = null;
      }
    }
  }
}

const socketService = new SocketService();
export default socketService;
