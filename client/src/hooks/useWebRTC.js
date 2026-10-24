import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket } from '../services/socket';
import { RTC_CONFIG } from '../config/webrtc';
import { getVerifiedIdToken } from '../services/userService';

export function useWebRTC({
  roomId,
  currentUser = null,
  userId,
  userName,
  avatarId,
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  onAuthRequired
}) {
  // Remote peers map: peerId -> { socketId, userName, avatarId, audioEnabled, videoEnabled, stream }
  const [peers, setPeers] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [selfPeer, setSelfPeer] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [roomMedia, setRoomMedia] = useState(null);
  const [isSessionTransferred, setIsSessionTransferred] = useState(false);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const transferredRef = useRef(false);

  // Map of peerId -> RTCPeerConnection
  const peerConnections = useRef(new Map());
  // Map of peerId -> Array of RTCIceCandidateInit (queued candidates)
  const candidateQueues = useRef(new Map());
  // Ref to current local stream for peer connections created dynamically
  const localStreamRef = useRef(localStream);
  localStreamRef.current = localStream;
  const isAudioEnabledRef = useRef(isAudioEnabled);
  isAudioEnabledRef.current = isAudioEnabled;
  const isVideoEnabledRef = useRef(isVideoEnabled);
  isVideoEnabledRef.current = isVideoEnabled;

  const reconnect = useCallback(() => {
    transferredRef.current = false;
    setIsSessionTransferred(false);
    setReconnectTrigger((t) => t + 1);
  }, []);

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
    const existingPc = peerConnections.current.get(peerId);
    if (existingPc && existingPc.connectionState !== 'closed' && existingPc.connectionState !== 'failed') {
      return existingPc;
    }
    if (existingPc) {
      try {
        existingPc.close();
      } catch (_) {}
      peerConnections.current.delete(peerId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnections.current.set(peerId, pc);

    // Initialize remote stream container
    const remoteStream = new MediaStream();

    // Register tracks from local stream or add recvonly transceivers (#6)
    const hasAudio = localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0;
    const hasVideo = localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0;

    if (hasAudio) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      } catch (e) {
        console.warn('Could not add audio recvonly transceiver:', e);
      }
    }

    if (hasVideo) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    } else {
      try {
        pc.addTransceiver('video', { direction: 'recvonly' });
      } catch (e) {
        console.warn('Could not add video recvonly transceiver:', e);
      }
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

    // Connection state changes (#7: recovery & cleanup)
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        console.log(`[WebRTC] Connection to ${peerId} failed, attempting ICE restart...`);
        try {
          pc.restartIce();
        } catch (e) {
          console.warn(`ICE restart failed for ${peerId}:`, e);
        }
      } else if (pc.connectionState === 'closed') {
        peerConnections.current.delete(peerId);
        candidateQueues.current.delete(peerId);
      }
    };

    return pc;
  }, []);

  // Main Socket & WebRTC setup
  useEffect(() => {
    if (!roomId) return;

    const socket = connectSocket();

    const handleConnect = async () => {
      setConnectionStatus('connected');
      console.log('[Socket] Connected to signaling server, joining room:', roomId);

      let idToken = null;
      try {
        if (currentUser && typeof currentUser.getIdToken === 'function') {
          idToken = await currentUser.getIdToken();
        }
        if (!idToken) {
          idToken = await getVerifiedIdToken();
        }
      } catch (tokenErr) {
        console.warn('[WebRTC Auth] Could not retrieve Firebase ID token:', tokenErr);
      }

      // If still no token and user ID exists, attempt force refresh
      if (!idToken && userId) {
        try {
          idToken = await getVerifiedIdToken(true);
        } catch {}
      }

      socket.emit(
        'join-room',
        {
          roomId,
          idToken,
          userId,
          userName,
          avatarId: avatarId || 'cyber-rebel',
          audioEnabled: isAudioEnabledRef.current,
          videoEnabled: isVideoEnabledRef.current
        },
        async (response) => {
          if (response?.error) {
            console.error('Failed to join room:', response.error);
            setConnectionStatus('disconnected');
            if (response.error.toLowerCase().includes('auth') && typeof onAuthRequired === 'function') {
              onAuthRequired(response.error);
            }
            return;
          }

          setSelfPeer(response.self);
          setIsHost(!!response.isHost);
          if (response.media) {
            setRoomMedia(response.media);
          }

          // Build peers state for existing peers (#9: functional merge to never wipe out live streams)
          const initialPeers = {};
          for (const peer of response.peers) {
            // Defensive: Avoid self-peering if user has another session
            if (peer.userId && peer.userId === userId) continue;

            initialPeers[peer.socketId] = {
              socketId: peer.socketId,
              userName: peer.userName,
              audioEnabled: peer.audioEnabled,
              videoEnabled: peer.videoEnabled,
              stream: new MediaStream()
            };
          }

          // Merged functionally prior to offer loop so tracks can attach immediately
          setPeers((prev) => ({
            ...initialPeers,
            ...prev
          }));

          // Initiate offer to each existing peer
          for (const peer of response.peers) {
            if (peer.userId && peer.userId === userId) continue;

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
        }
      );
    };

    const handlePeerJoined = (peer) => {
      // Defensive: Avoid self-peering
      if (peer.userId && peer.userId === userId) return;

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
      // Clean up stale peer connections on socket disconnection (#8)
      for (const [peerId, pc] of peerConnections.current.entries()) {
        try {
          pc.close();
        } catch (_) {}
      }
      peerConnections.current.clear();
      candidateQueues.current.clear();
      setPeers({});
    };

    const handleSessionTransferred = ({ reason }) => {
      console.warn('[Room] Session transferred to another tab:', reason);
      transferredRef.current = true;
      setIsSessionTransferred(true);
      for (const [peerId, pc] of peerConnections.current.entries()) {
        try {
          pc.close();
        } catch (_) {}
      }
      peerConnections.current.clear();
      candidateQueues.current.clear();
      setPeers({});
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
    const handleHostChanged = ({ hostSocketId }) => {
      setIsHost(socket.id === hostSocketId);
    };

    socket.on('peer-media-updated', handlePeerMediaUpdated);
    socket.on('peer-left', handlePeerLeft);
    socket.on('host-changed', handleHostChanged);
    socket.on('session-transferred', handleSessionTransferred);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('peer-joined', handlePeerJoined);
      socket.off('receive-signal', handleReceiveSignal);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('peer-media-updated', handlePeerMediaUpdated);
      socket.off('peer-left', handlePeerLeft);
      socket.off('host-changed', handleHostChanged);
      socket.off('session-transferred', handleSessionTransferred);
      socket.off('disconnect', handleDisconnect);

      // Leave room if this session wasn't transferred to another tab
      if (!transferredRef.current) {
        socket.emit('leave-room', { roomId });
      }
      for (const [peerId, pc] of peerConnections.current.entries()) {
        try {
          pc.close();
        } catch (_) {}
      }
      peerConnections.current.clear();
      candidateQueues.current.clear();
      setPeers({});
    };
  }, [roomId, userName, createPeerConnection, reconnectTrigger]);

  // Sync local media mute/video toggles with signaling server
  useEffect(() => {
    const socket = getSocket();
    if (socket && socket.connected && roomId && !isSessionTransferred) {
      socket.emit('media-toggle', {
        roomId,
        audioEnabled: isAudioEnabled,
        videoEnabled: isVideoEnabled
      });
    }
  }, [isAudioEnabled, isVideoEnabled, roomId, isSessionTransferred]);

  return {
    peers: Object.values(peers),
    selfPeer,
    connectionStatus,
    isHost,
    roomMedia,
    isSessionTransferred,
    reconnect
  };
}
