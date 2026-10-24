import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';

/**
 * Real-time chat messages display and composer for the Watch Party room.
 *
 * @param {Object} props
 * @param {Array} props.chatMessages
 * @param {string} props.userName
 * @param {Function} props.onSendMessage
 */
export default function ChatTab({ chatMessages = [], userName, onSendMessage }) {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-full">
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#9aa6af]">
            <MessageSquare className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs font-bold text-white">Room Chat</p>
            <p className="text-[11px] mt-1">Send a message to everyone watching the stream!</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderName === userName;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-[#9aa6af] mb-0.5 px-1">
                  <span className="font-bold text-white">{msg.senderName}</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                    isMe
                      ? 'bg-[#ff7a00] text-white rounded-br-xs shadow-glow-orange'
                      : 'bg-[#1b2229] text-white rounded-bl-xs border border-white/5'
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
      <form onSubmit={handleSendChat} className="mt-3 pt-2 border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Comment on the scene..."
          className="flex-1 px-3 py-2 rounded-xl bg-[#080d10] border border-white/10 text-white text-xs placeholder-[#9aa6af]/50 focus:outline-none focus:border-[#ff7a00] transition-colors"
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="p-2 rounded-xl bg-[#ff7a00] hover:bg-[#ff9124] disabled:opacity-30 text-white transition-all shadow-glow-orange cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
