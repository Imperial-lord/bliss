import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket } from '../services/socket';
import { RTC_CONFIG } from '../config/webrtc';

export function useWebRTC({ roomId, userName, avatarId, localStream, isAudioEnabled, isVideoEnabled }) {
  // Remote peers map: peerId -> { socketId, userName, avatarId, audioEnabled, videoEnabled, stream }
  const [peers, setPeers] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [selfPeer, setSelfPeer] = useState(null);

  // Map of peerId -> RTCPeerConnection
  const peerConnections = useRef(new Map());
  // Map of peerId -> Array of RTCIceCandidateInit (queued candidates)
  const candidateQueues = useRef(new Map());
  // Ref to current local stream for peer connections created dynamically
  const localStreamRef = useRef(localStream);
  localStreamRef.current = localStream;

  // Helper to get or initialize candidate queue
  const getQueue = (peerId) => {
    if (!candidateQueues.current.has(peerId)) {
      candidateQueues.current.set(peerId, []);
    }
    return candidateQueues.current.get(peerId);
  };

  // Helper to drain queued ICE candidates once remote description is set
  const drainCandidateQueue = async (peerId, pc) => {
    const queue = candidateQueues.current.get(peerId) || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(`Error adding queued ICE candidate for ${peerId}:`, err);
      }
    }
  };

  // Create a peer connection for a given peerId
  const createPeerConnection = useCallback((peerId, peerUserName, socket) => {
    if (peerConnections.current.has(peerId)) {
      return peerConnections.current.get(peerId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.current.set(peerId, pc);

    // Initialize remote stream container
    const remoteStream = new MediaStream();

    // Register tracks from local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${peerId}:`, event.track.kind);
      event.streams[0]?.getTracks().forEach((track) => {
        if (!remoteStream.getTracks().some((t) => t.id === track.id)) {
          remoteStream.addTrack(track);
        }
      });

      setPeers((prev) => {
        const existing = prev[peerId] || {};
        return {
          ...prev,
          [peerId]: {
            ...existing,
            socketId: peerId,
            userName: peerUserName || existing.userName || `User_${peerId.slice(0, 4)}`,
            stream: remoteStream
          }
        };
      });
    };

    // Handle ICE candidates generated locally
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // Handled or cleanup
      }
    };

    return pc;
  }, []);

  // Replace video track across all active peer connections (e.g., when screen sharing)
  const replaceVideoTrack = useCallback(async (newTrack) => {
    for (const [peerId, pc] of peerConnections.current.entries()) {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        try {
          await videoSender.replaceTrack(newTrack);
          console.log(`[WebRTC] Successfully replaced video track for peer ${peerId}`);
        } catch (err) {
          console.error(`[WebRTC] Failed to replace video track for peer ${peerId}:`, err);
        }
      } else if (newTrack) {
        // If there was no video sender yet, add the track
        pc.addTrack(newTrack, localStreamRef.current);
      }
    }
  }, []);

  // Main Socket & WebRTC setup
  useEffect(() => {
    if (!roomId) return;

    const socket = connectSocket();

    const handleConnect = () => {
      setConnectionStatus('connected');
      console.log('[Socket] Connected to signaling server, joining room:', roomId);

      socket.emit(
        'join-room',
        {
          roomId,
          userName,
          avatarId: avatarId || 'cyber-rebel',
          audioEnabled: isAudioEnabled,
          videoEnabled: isVideoEnabled
        },
        async (response) => {
          if (response?.error) {
            console.error('Failed to join room:', response.error);
            setConnectionStatus('disconnected');
            return;
          }

          setSelfPeer(response.self);

          // Build peers state for existing peers
          const initialPeers = {};
          for (const peer of response.peers) {
            initialPeers[peer.socketId] = {
              socketId: peer.socketId,
              userName: peer.userName,
              audioEnabled: peer.audioEnabled,
              videoEnabled: peer.videoEnabled,
              stream: new MediaStream()
            };

            // Initiate offer to each existing peer
            const pc = createPeerConnection(peer.socketId, peer.userName, socket);
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('signal', {
                to: peer.socketId,
                signal: offer
              });
            } catch (err) {
              console.error(`Error creating offer to ${peer.socketId}:`, err);
            }
          }

          setPeers(initialPeers);
        }
      );
    };

    const handlePeerJoined = (peer) => {
      console.log('[Room] Peer joined:', peer);
      setPeers((prev) => ({
        ...prev,
        [peer.socketId]: {
          socketId: peer.socketId,
          userName: peer.userName,
          audioEnabled: peer.audioEnabled,
          videoEnabled: peer.videoEnabled,
          stream: new MediaStream()
        }
      }));
    };

    const handleReceiveSignal = async ({ from, signal }) => {
      console.log(`[WebRTC] Received signal ${signal.type} from ${from}`);
      let pc = peerConnections.current.get(from);

      if (!pc) {
        pc = createPeerConnection(from, peers[from]?.userName, socket);
      }

      if (signal.type === 'offer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await drainCandidateQueue(from, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('signal', {
            to: from,
            signal: answer
          });
        } catch (err) {
          console.error(`Error handling offer from ${from}:`, err);
        }
      } else if (signal.type === 'answer') {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          await drainCandidateQueue(from, pc);
        } catch (err) {
          console.error(`Error handling answer from ${from}:`, err);
        }
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const pc = peerConnections.current.get(from);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error(`Error adding ICE candidate from ${from}:`, err);
        }
      } else {
        // Buffer until remote description is ready
        getQueue(from).push(candidate);
      }
    };

    const handlePeerMediaUpdated = ({ socketId, audioEnabled, videoEnabled }) => {
      setPeers((prev) => {
        const peer = prev[socketId];
        if (!peer) return prev;
        return {
          ...prev,
          [socketId]: {
            ...peer,
            audioEnabled,
            videoEnabled
          }
        };
      });
    };

    const handlePeerLeft = ({ socketId }) => {
      console.log('[Room] Peer left:', socketId);
      const pc = peerConnections.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(socketId);
      }
      candidateQueues.current.delete(socketId);

      setPeers((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    // Attach listeners
    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('peer-joined', handlePeerJoined);
    socket.on('receive-signal', handleReceiveSignal);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('peer-media-updated', handlePeerMediaUpdated);
    socket.on('peer-left', handlePeerLeft);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('peer-joined', handlePeerJoined);
      socket.off('receive-signal', handleReceiveSignal);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('peer-media-updated', handlePeerMediaUpdated);
      socket.off('peer-left', handlePeerLeft);
      socket.off('disconnect', handleDisconnect);

      // Leave room and close all peer connections
      socket.emit('leave-room', { roomId });
      for (const [peerId, pc] of peerConnections.current.entries()) {
        pc.close();
      }
      peerConnections.current.clear();
      candidateQueues.current.clear();
      setPeers({});
    };
  }, [roomId, userName, createPeerConnection]);

  // Sync local media mute/video toggles with signaling server
  useEffect(() => {
    const socket = getSocket();
    if (socket && socket.connected && roomId) {
      socket.emit('media-toggle', {
        roomId,
        audioEnabled: isAudioEnabled,
        videoEnabled: isVideoEnabled
      });
    }
  }, [isAudioEnabled, isVideoEnabled, roomId]);

  return {
    peers: Object.values(peers),
    selfPeer,
    connectionStatus,
    replaceVideoTrack
  };
}
