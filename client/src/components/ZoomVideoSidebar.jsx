import React, { useState } from 'react';
import { Users, MessageSquare } from 'lucide-react';
import VideoFeedsTab from './sidebar/VideoFeedsTab';
import ChatTab from './sidebar/ChatTab';
import ReactionPills from './sidebar/ReactionPills';

/**
 * Zoom-like video sidebar for watch party feeds, text chat, and quick reactions.
 *
 * @param {Object} props
 * @param {string} props.roomId
 * @param {string} props.userName
 * @param {Object} props.currentUser
 * @param {MediaStream} props.localStream
 * @param {boolean} props.isAudioEnabled
 * @param {boolean} props.isVideoEnabled
 * @param {Array} props.peers
 * @param {Array} props.chatMessages
 * @param {Function} props.onSendMessage
 * @param {Function} props.onSendReaction
 */
export default function ZoomVideoSidebar({
  roomId,
  userName,
  currentUser,
  localStream,
  isAudioEnabled,
  isVideoEnabled,
  peers = [],
  chatMessages = [],
  onSendMessage,
  onSendReaction
}) {
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'chat'
  const totalPeople = peers.length + 1;

  return (
    <div className="w-full h-full flex flex-col bg-[#12171c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl font-sans">
      {/* Top Header & Tab Controls */}
      <div className="px-4 py-3 bg-[#080d10] border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#1b2229] px-2.5 py-1 rounded-full text-xs font-bold text-white border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-pulse" />
            <span>Call</span>
            <span className="text-[#ff7a00] font-mono">({totalPeople})</span>
          </div>
        </div>

        {/* Tab Switcher: Video vs Chat */}
        <div className="flex items-center bg-[#141a1f] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                : 'text-[#9aa6af] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Feeds</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                : 'text-[#9aa6af] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {chatMessages.length > 0 && activeTab !== 'chat' && (
              <span className="w-2 h-2 rounded-full bg-[#ff3d2e] absolute top-1 right-1" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area: Video Feeds or Chat */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">
        {activeTab === 'video' ? (
          <VideoFeedsTab
            localStream={localStream}
            userName={userName}
            currentUser={currentUser}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            peers={peers}
          />
        ) : (
          <ChatTab
            chatMessages={chatMessages}
            userName={userName}
            onSendMessage={onSendMessage}
          />
        )}
      </div>

      {/* Floating Emoji Reactions Bar */}
      <ReactionPills onSendReaction={onSendReaction} />
    </div>
  );
}
