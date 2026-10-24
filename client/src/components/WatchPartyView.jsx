import React, { useState } from 'react';
import { Film, Users, ArrowLeft, Sparkles } from 'lucide-react';
import MoviePlayer from './MoviePlayer';
import ZoomVideoSidebar from './ZoomVideoSidebar';
import CallControls from './CallControls';
import { useWatchPartyCinema } from '../hooks/useWatchPartyCinema';

/**
 * Main Watch Party Room View with Split Screen:
 * LHS: Cinema Stage with synchronized video streaming
 * RHS: Zoom-like multi-peer video calling feeds and chat
 *
 * @param {Object} props
 */
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
  onToggleAudio,
  onToggleVideo,
  onLeaveCall
}) {
  const [viewMode, setViewMode] = useState('cinema');

  // Encapsulated Watch Party Cinema Hook
  const {
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
  } = useWatchPartyCinema({
    roomId,
    isHost,
    initialMedia,
    currentUser,
    userName,
    peers
  });

  const totalParticipants = peers.length + 1;

  return (
    <div className="relative h-screen w-full bg-[#080d10] flex flex-col overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 border-b border-white/5 bg-[#12171c]/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onLeaveCall}
            className="p-2 rounded-xl bg-[#080d10] hover:bg-[#1b2229] border border-white/10 text-[#9aa6af] hover:text-white transition-colors cursor-pointer"
            title="Leave Cinema"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 font-display font-extrabold text-xl text-white tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ff7a00] to-[#ff3d2e] flex items-center justify-center shadow-glow-orange">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span>BLISS</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1" />

          <div className="flex items-center gap-2 bg-[#080d10] px-3 py-1 rounded-full text-xs font-mono text-white border border-white/10">
            <span className="text-[#9aa6af]">Room:</span>
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#9aa6af] bg-[#080d10] px-3 py-1.5 rounded-full border border-white/5">
            <Users className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span>
              {totalParticipants} {totalParticipants === 1 ? 'Viewer' : 'Viewers'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Mesh
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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
              onCueMovie={cueMovie}
              onSyncPlayback={syncPlayback}
              remotePlayback={remotePlayback}
            />
          </div>

          {/* RHS: Zoom-like Video Call Panel */}
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
              onSendMessage={sendMessage}
              onSendReaction={sendReaction}
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
    </div>
  );
}
