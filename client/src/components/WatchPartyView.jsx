import React, { useState, useEffect } from 'react';
import { Film, Users, ShieldCheck, ArrowLeft, Radio, Sparkles } from 'lucide-react';
import MoviePlayer from './MoviePlayer';
import ZoomVideoSidebar from './ZoomVideoSidebar';
import CallControls from './CallControls';
import ThemeToggle from './ThemeToggle';
import { getSocket } from '../services/socket';
import { logCinemaSession } from '../services/sessionAnalytics';

export default function WatchPartyView({
  roomId,
  userName,
  currentUser,
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  peers,
  connectionStatus,
  isHost = false,
  initialMedia = null,
  isSessionTransferred = false,
  onUseThisTab,
  onToggleAudio,
  onToggleVideo,
  onLeaveCall
}) {
  const [viewMode, setViewMode] = useState('cinema'); // 'cinema' or 'grid'
  const [chatMessages, setChatMessages] = useState([]);
  const [activeReactions, setActiveReactions] = useState([]);

  // Cinema Streaming & Host Authority State
  const [mediaStatus, setMediaStatus] = useState(initialMedia?.status || 'idle');
  const [mediaTitle, setMediaTitle] = useState(initialMedia?.title || '');
  const [mediaMessage, setMediaMessage] = useState('');
  const [subtitles, setSubtitles] = useState(initialMedia?.subtitles || []);
  const [hostErrorMessage, setHostErrorMessage] = useState('');
  const [remotePlayback, setRemotePlayback] = useState(initialMedia?.playback || null);

  // Keep live references to avoid stale closure in long-lived socket listeners (#12)
  const isHostRef = React.useRef(isHost);
  isHostRef.current = isHost;
  const peersRef = React.useRef(peers);
  peersRef.current = peers;
  const currentUserRef = React.useRef(currentUser);
  currentUserRef.current = currentUser;

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

    // Explicitly request playback sync from server upon entering room (#1)
    socket.emit('request-playback-sync', { roomId }, (response) => {
      if (response?.playback) {
        setRemotePlayback(response.playback);
      }
      if (response?.status) {
        setMediaStatus(response.status);
      }
      if (response?.title) {
        setMediaTitle(response.title);
      }
      if (response?.subtitles) {
        setSubtitles(response.subtitles);
      }
    });

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
        if (isHostRef.current) {
          logCinemaSession({
            roomId,
            hostUid: currentUserRef.current?.uid,
            title: statusData.title || 'Torrent Cinema Stream',
            totalViewers: (peersRef.current?.length || 0) + 1
          });
        }
      }
    };

    // CRITICAL REQUIREMENT: Host-only error banner delivery
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
  }, []);

  const handleCueMovie = (url) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      setHostErrorMessage('');
      socket.emit('set-movie-source', {
        roomId,
        sourceUrl: url
      });
    }
  };

  const handleSyncPlayback = (action, currentTime) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('sync-playback', {
        roomId,
        action,
        currentTime
      });
    }
  };

  const handleSendMessage = (text) => {
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
  };

  const handleSendReaction = (emoji) => {
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
  };

  const totalParticipants = peers.length + 1;

  return (
    <div className="relative h-screen w-full bg-slate-100 text-slate-900 dark:bg-[#080d10] dark:text-[#e9e9e9] flex flex-col overflow-hidden font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 border-b border-slate-200/80 dark:border-white/5 bg-white/90 dark:bg-[#12171c]/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeaveCall}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-600 hover:text-slate-900 dark:bg-[#080d10] dark:hover:bg-[#1b2229] dark:border-white/10 dark:text-[#9aa6af] dark:hover:text-white transition-colors"
            title="Leave Cinema"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 font-display font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center shadow-glow-orange">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span>BLISS</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#080d10] px-3 py-1 rounded-full text-xs font-mono text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/10">
            <span className="text-slate-500 dark:text-[#9aa6af]">Room:</span>
            <span className="font-bold text-[#ff7a00]">{roomId}</span>
          </div>

          {/* Host Badge Indicator */}
          {isHost && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff7a00]/15 text-[#ff7a00] text-[10px] font-bold uppercase tracking-wider border border-[#ff7a00]/30 shadow-glow-orange/20">
              <Sparkles className="w-3 h-3" />
              <span>Room Host</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#9aa6af] bg-slate-100 dark:bg-[#080d10] px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-white/5">
            <Users className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span>
              {totalParticipants} {totalParticipants === 1 ? 'Viewer' : 'Viewers'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live Mesh
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                {connectionStatus}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Stage: LHS Movie Streaming + RHS Zoom Video Call */}
      <main className="flex-1 p-4 pb-24 overflow-hidden relative">
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LHS: Movie Streaming Theater Screen */}
          <div className="lg:col-span-8 xl:col-span-9 h-full flex flex-col min-h-[300px]">
            <MoviePlayer
              roomId={roomId}
              isHost={isHost}
              mediaStatus={mediaStatus}
              mediaMessage={mediaMessage}
              mediaTitle={mediaTitle}
              subtitles={subtitles}
              hostErrorMessage={hostErrorMessage}
              reactions={activeReactions}
              onCueMovie={handleCueMovie}
              onSyncPlayback={handleSyncPlayback}
              remotePlayback={remotePlayback}
            />
          </div>

          {/* RHS: Zoom-like Video Call Panel for Multiple People */}
          <div className="lg:col-span-4 xl:col-span-3 h-full flex flex-col min-h-[300px]">
            <ZoomVideoSidebar
              roomId={roomId}
              userName={userName}
              currentUser={currentUser}
              localStream={localStream}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              peers={peers}
              chatMessages={chatMessages}
              onSendMessage={handleSendMessage}
              onSendReaction={handleSendReaction}
            />
          </div>
        </div>
      </main>

      {/* Floating Bottom Call Controls */}
      <CallControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        viewMode={viewMode}
        roomId={roomId}
        onToggleAudio={onToggleAudio}
        onToggleVideo={onToggleVideo}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'cinema' ? 'grid' : 'cinema'))}
        onLeaveCall={onLeaveCall}
      />

      {/* Session Transferred Modal / Takeover Screen */}
      {isSessionTransferred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/85 backdrop-blur-md transition-all animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-[#12181d] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Active in Another Tab
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                You joined watch party <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">"{roomId}"</span> from another tab or window. Audio, camera, and movie synchronization have transferred to the newer tab to prevent echoes and conflicts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onLeaveCall}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
              >
                Exit to Home
              </button>
              <button
                type="button"
                onClick={onUseThisTab}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#ff7a00] to-[#ff9e3b] hover:opacity-95 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                Use This Tab Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
