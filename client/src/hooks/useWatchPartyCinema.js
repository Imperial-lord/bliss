import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { logCinemaSession } from '../services/sessionAnalytics';

/**
 * Manages all WebSocket communications, chat messages, emoji reactions,
 * and synchronized cinema state for a watch party room.
 *
 * @param {Object} params
 * @param {string} params.roomId
 * @param {boolean} params.isHost
 * @param {Object|null} params.initialMedia
 * @param {Object|null} params.currentUser
 * @param {string} params.userName
 * @param {Array} params.peers
 */
export function useWatchPartyCinema({
  roomId,
  isHost,
  initialMedia,
  currentUser,
  userName,
  peers = []
}) {
  const [chatMessages, setChatMessages] = useState([]);
  const [activeReactions, setActiveReactions] = useState([]);

  // Cinema Streaming & Host Authority State
  const [mediaStatus, setMediaStatus] = useState(initialMedia?.status || 'idle');
  const [mediaTitle, setMediaTitle] = useState(initialMedia?.title || '');
  const [mediaMessage, setMediaMessage] = useState('');
  const [subtitles, setSubtitles] = useState(initialMedia?.subtitles || []);
  const [hostErrorMessage, setHostErrorMessage] = useState('');
  const [remotePlayback, setRemotePlayback] = useState(initialMedia?.playback || null);

  // Sync state if initialMedia changes
  useEffect(() => {
    if (initialMedia) {
      if (initialMedia.status) setMediaStatus(initialMedia.status);
      if (initialMedia.title) setMediaTitle(initialMedia.title);
      if (initialMedia.subtitles) setSubtitles(initialMedia.subtitles);
      if (initialMedia.playback) setRemotePlayback(initialMedia.playback);
    }
  }, [initialMedia]);

  // Socket chat, reaction, and torrent streaming listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleReceiveChat = (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const handleReceiveReaction = (react) => {
      setActiveReactions((prev) => [...prev, react]);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== react.id));
      }, 3500);
    };

    // Cinema Streaming Socket Handlers
    const handleMovieStatusChanged = (statusData) => {
      console.log('[Socket] Movie status changed:', statusData);
      if (statusData.status) setMediaStatus(statusData.status);
      if (statusData.title) setMediaTitle(statusData.title);
      if (statusData.message) setMediaMessage(statusData.message);
      if (statusData.subtitles) setSubtitles(statusData.subtitles);
      if (statusData.status === 'ready') {
        setHostErrorMessage('');
        setMediaMessage('');
        if (isHost) {
          logCinemaSession({
            roomId,
            hostUid: currentUser?.uid,
            title: statusData.title || 'Torrent Cinema Stream',
            totalViewers: peers.length + 1
          });
        }
      }
    };

    // Host-only error banner delivery
    const handleHostMovieError = ({ error }) => {
      console.warn('[Host Error Received]:', error);
      setHostErrorMessage(error || 'Failed to cue movie stream.');
      setMediaStatus('idle');
    };

    const handlePlaybackUpdated = (playbackData) => {
      setRemotePlayback(playbackData);
    };

    socket.on('receive-chat', handleReceiveChat);
    socket.on('receive-reaction', handleReceiveReaction);
    socket.on('movie-status-changed', handleMovieStatusChanged);
    socket.on('host-movie-error', handleHostMovieError);
    socket.on('playback-updated', handlePlaybackUpdated);

    return () => {
      socket.off('receive-chat', handleReceiveChat);
      socket.off('receive-reaction', handleReceiveReaction);
      socket.off('movie-status-changed', handleMovieStatusChanged);
      socket.off('host-movie-error', handleHostMovieError);
      socket.off('playback-updated', handlePlaybackUpdated);
    };
  }, [roomId, isHost, currentUser, peers.length]);

  const cueMovie = useCallback(
    (url) => {
      const socket = getSocket();
      if (socket && socket.connected) {
        setHostErrorMessage('');
        socket.emit('set-movie-source', {
          roomId,
          sourceUrl: url
        });
      }
    },
    [roomId]
  );

  const syncPlayback = useCallback(
    (action, currentTime) => {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('sync-playback', {
          roomId,
          action,
          currentTime
        });
      }
    },
    [roomId]
  );

  const sendMessage = useCallback(
    (text) => {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send-chat', {
          roomId,
          message: text,
          senderName: userName,
          avatarId: currentUser?.avatarId || 'cyber-rebel'
        });
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `local_${Date.now()}`,
            senderName: userName,
            message: text,
            timestamp: Date.now()
          }
        ]);
      }
    },
    [roomId, userName, currentUser]
  );

  const sendReaction = useCallback(
    (emoji) => {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send-reaction', {
          roomId,
          emoji,
          senderName: userName
        });
      }
      const localReact = {
        id: `local_react_${Date.now()}`,
        emoji,
        senderName: userName
      };
      setActiveReactions((prev) => [...prev, localReact]);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== localReact.id));
      }, 3500);
    },
    [roomId, userName]
  );

  return {
    chatMessages,
    activeReactions,
    mediaStatus,
    mediaTitle,
    mediaMessage,
    subtitles,
    hostErrorMessage,
    remotePlayback,
    cueMovie,
    syncPlayback,
    sendMessage,
    sendReaction
  };
}
