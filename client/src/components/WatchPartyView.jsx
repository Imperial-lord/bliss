import React, { useState } from 'react';
import { Film, Users, Wifi, ArrowLeft } from 'lucide-react';
import VideoTile from './VideoTile';
import MoviePlayer from './MoviePlayer';
import CallControls from './CallControls';

export default function WatchPartyView({
  roomId,
  userName,
  currentUser,
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  peers,
  connectionStatus,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveCall
}) {
  const [viewMode, setViewMode] = useState('cinema'); // 'cinema' or 'grid'

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'cinema' ? 'grid' : 'cinema'));
  };

  const totalParticipants = peers.length + 1; // peers + self

  return (
    <div className="relative min-h-screen w-full bg-[#080d10] flex flex-col overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 border-b border-white/5 bg-[#12171c]/80 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
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
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-[#9aa6af] font-semibold uppercase tracking-wider bg-[#080d10] px-3 py-1.5 rounded-full border border-white/5">
            <Users className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span>{totalParticipants} {totalParticipants === 1 ? 'Viewer' : 'Viewers'}</span>
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

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-24 overflow-hidden relative">
        {viewMode === 'cinema' ? (
          /* Cinema View: Movie stage on left/center, Video sidebar on right */
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Primary Movie Stage */}
            <div className="lg:col-span-9 h-full flex flex-col min-h-[300px]">
              <MoviePlayer />
            </div>

            {/* Side Call Column */}
            <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto pr-1 max-h-full">
              {/* Local Video Tile */}
              <div className="w-full shrink-0">
                <VideoTile
                  stream={localStream}
                  userName={userName}
                  avatarId={currentUser?.avatarId || 'cyber-rebel'}
                  isLocal={true}
                  isAudioEnabled={isAudioEnabled}
                  isVideoEnabled={isVideoEnabled}
                  isScreenSharing={isScreenSharing}
                />
              </div>

              {/* Remote Peer Video Tiles */}
              {peers.map((peer) => (
                <div key={peer.socketId} className="w-full shrink-0">
                  <VideoTile
                    stream={peer.stream}
                    userName={peer.userName}
                    avatarId={peer.avatarId || 'star-voyager'}
                    isLocal={false}
                    isAudioEnabled={peer.audioEnabled}
                    isVideoEnabled={peer.videoEnabled}
                  />
                </div>
              ))}

              {peers.length === 0 && (
                <div className="p-6 rounded-3xl border border-dashed border-white/10 text-center text-xs text-[#9aa6af] bg-[#12171c]/50">
                  <p className="font-semibold text-white">No other viewers yet</p>
                  <p className="mt-1">Share the invite link with your circle to watch and talk together!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Grid View: Pure Call Mesh layout */
          <div
            className={`w-full h-full grid gap-4 p-2 auto-rows-fr ${
              totalParticipants === 1
                ? 'grid-cols-1 max-w-2xl mx-auto'
                : totalParticipants === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
                : totalParticipants <= 4
                ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto'
                : 'grid-cols-2 md:grid-cols-3 max-w-7xl mx-auto'
            }`}
          >
            {/* Self Video */}
            <VideoTile
              stream={localStream}
              userName={userName}
              avatarId={currentUser?.avatarId || 'cyber-rebel'}
              isLocal={true}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              isScreenSharing={isScreenSharing}
            />

            {/* Remote Videos */}
            {peers.map((peer) => (
              <VideoTile
                key={peer.socketId}
                stream={peer.stream}
                userName={peer.userName}
                avatarId={peer.avatarId || 'star-voyager'}
                isLocal={false}
                isAudioEnabled={peer.audioEnabled}
                isVideoEnabled={peer.videoEnabled}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Call Controls */}
      <CallControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        viewMode={viewMode}
        roomId={roomId}
        onToggleAudio={onToggleAudio}
        onToggleVideo={onToggleVideo}
        onToggleScreenShare={onToggleScreenShare}
        onToggleViewMode={toggleViewMode}
        onLeaveCall={onLeaveCall}
      />
    </div>
  );
}
