import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Grid,
  Columns
} from 'lucide-react';
import VideoTile from './VideoTile';
import { AVATAR_OPTIONS } from '../constants/avatars';

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
  const [layoutMode, setLayoutMode] = useState('auto'); // 'auto' | 'grid'
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const totalPeople = peers.length + 1;

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const reactions = ['❤️', '🔥', '🍿', '😂', '👏', '😱'];

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#12171c] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl font-sans transition-colors duration-200">
      {/* Top Header & Tab Controls */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-[#080d10] border-b border-slate-200/80 dark:border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1b2229] px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#ff7a00] animate-pulse" />
            <span>Call</span>
            <span className="text-[#ff7a00] font-mono">({totalPeople})</span>
          </div>
        </div>

        {/* Tab Switcher: Video vs Chat */}
        <div className="flex items-center bg-slate-100 dark:bg-[#141a1f] p-1 rounded-xl border border-slate-200/80 dark:border-white/5">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'video'
                ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#9aa6af] dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Feeds</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative ${
              activeTab === 'chat'
                ? 'bg-[#ff7a00] text-white shadow-glow-orange'
                : 'text-slate-600 hover:text-slate-900 dark:text-[#9aa6af] dark:hover:text-white'
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
          /* Multi-person Zoom Video Feeds */
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
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 hover:border-[#ff7a00]/50 transition-all bg-black aspect-video">
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
                className="relative group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 hover:border-[#ff7a00]/50 transition-all bg-black aspect-video"
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
              <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-center bg-slate-50 dark:bg-[#080d10]/40 flex flex-col items-center justify-center my-auto">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1b2229] flex items-center justify-center text-lg mb-2">
                  🍿
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Solo Theater</p>
                <p className="text-[11px] text-slate-500 dark:text-[#9aa6af] mt-1 max-w-[180px]">
                  Share the room link to watch together with friends!
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Live Party Chat Tab */
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-[#9aa6af]">
                  <MessageSquare className="w-8 h-8 opacity-30 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-white">Room Chat</p>
                  <p className="text-[11px] mt-1">Send a message to everyone watching the stream!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderName === userName;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-[#9aa6af] mb-0.5 px-1">
                        <span className="font-bold text-slate-800 dark:text-white">{msg.senderName}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                          isMe
                            ? 'bg-[#ff7a00] text-white rounded-br-xs shadow-glow-orange'
                            : 'bg-slate-100 text-slate-800 dark:bg-[#1b2229] dark:text-white rounded-bl-xs border border-slate-200/80 dark:border-white/5'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Box */}
            <form onSubmit={handleSendChat} className="mt-3 pt-2 border-t border-slate-200/80 dark:border-white/5 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Comment on the scene..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080d10] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors focus:bg-white dark:focus:bg-[#080d10]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-[#ff7a00] hover:bg-[#ff9124] disabled:opacity-30 text-white transition-all shadow-glow-orange"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Floating Emoji Reactions Bar (Teleport Style) */}
      <div className="p-3 bg-slate-50 dark:bg-[#080d10] border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#9aa6af]">
          React
        </span>
        <div className="flex items-center gap-1.5">
          {reactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="w-8 h-8 rounded-full bg-white dark:bg-[#141a1f] hover:bg-slate-100 dark:hover:bg-[#1b2229] border border-slate-200/80 dark:border-white/5 hover:border-orange-500/40 dark:hover:border-[#ff7a00]/40 flex items-center justify-center text-sm transition-transform active:scale-125 hover:scale-110 shadow-sm"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
