import React from 'react';
import VideoTile from '../VideoTile';

/**
 * Multi-person Zoom video feeds view for Watch Party participants.
 *
 * @param {Object} props
 * @param {MediaStream} props.localStream
 * @param {string} props.userName
 * @param {Object} props.currentUser
 * @param {boolean} props.isAudioEnabled
 * @param {boolean} props.isVideoEnabled
 * @param {Array} props.peers
 */
export default function VideoFeedsTab({
  localStream,
  userName,
  currentUser,
  isAudioEnabled,
  isVideoEnabled,
  peers = []
}) {
  const totalPeople = peers.length + 1;

  return (
    <div
      className={`w-full grid gap-2.5 ${
        totalPeople <= 2
          ? 'grid-cols-1'
          : totalPeople <= 4
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1'
          : 'grid-cols-2'
      }`}
    >
      {/* Self Video Card */}
      <div className="relative group rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff7a00]/50 transition-all bg-[#080d10] aspect-video">
        <VideoTile
          stream={localStream}
          userName={userName}
          avatarId={currentUser?.avatarId || 'cyber-rebel'}
          isLocal={true}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
        />
        {/* Voice waveform animation indicator when audio is enabled */}
        {isAudioEnabled && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-1.5 py-1 rounded-md border border-white/10">
            <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-bounce" />
            <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Remote Peers Video Cards */}
      {peers.map((peer, idx) => (
        <div
          key={peer.socketId}
          className="relative group rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff7a00]/50 transition-all bg-[#080d10] aspect-video"
        >
          <VideoTile
            stream={peer.stream}
            userName={peer.userName}
            avatarId={peer.avatarId || (idx % 2 === 0 ? 'star-voyager' : 'popcorn-fanatic')}
            isLocal={false}
            isAudioEnabled={peer.audioEnabled}
            isVideoEnabled={peer.videoEnabled}
          />
          {peer.audioEnabled && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-1.5 py-1 rounded-md border border-white/10">
              <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>
      ))}

      {peers.length === 0 && (
        <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center bg-[#080d10]/40 flex flex-col items-center justify-center my-auto">
          <div className="w-10 h-10 rounded-full bg-[#1b2229] flex items-center justify-center text-lg mb-2">
            🍿
          </div>
          <p className="text-xs font-bold text-white">Solo Theater</p>
          <p className="text-[11px] text-[#9aa6af] mt-1 max-w-[180px]">
            Share the room link to watch together with friends!
          </p>
        </div>
      )}
    </div>
  );
}
