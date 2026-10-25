import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Maximize2,
  Users,
  MicOff,
  VideoOff,
  GripHorizontal,
  X,
  Volume2
} from 'lucide-react';
import { AVATAR_OPTIONS } from '../constants/avatars';

export default function CinemaPipWidget({
  feeds = [],
  containerRef,
  isOpen = true,
  onClose,
  initialFeedIndex = 0
}) {
  const [currentIndex, setCurrentIndex] = useState(initialFeedIndex);
  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState('md'); // 'sm' | 'md' | 'lg'
  const [position, setPosition] = useState(null); // { x, y } in px relative to container
  const [isDragging, setIsDragging] = useState(false);

  const widgetRef = useRef(null);
  const videoRef = useRef(null);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });

  // Clamp current index if participants join or leave
  const safeIndex = feeds.length > 0 ? Math.min(currentIndex, feeds.length - 1) : 0;
  const currentFeed = feeds[safeIndex];

  // Attach media stream to video element when currentFeed or its stream changes
  useEffect(() => {
    if (videoRef.current && currentFeed?.stream) {
      videoRef.current.srcObject = currentFeed.stream;
    }
  }, [currentFeed?.stream, safeIndex, isMinimized]);

  // Check if anyone in call is currently speaking (for minimized pill indicator)
  const hasActiveSpeaker = feeds.some((f) => f.isSpeaking);

  // Cycle next participant (downward arrow)
  const handleNextFeed = (e) => {
    e?.stopPropagation();
    if (feeds.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % feeds.length);
  };

  // Cycle previous participant (upward arrow)
  const handlePrevFeed = (e) => {
    e?.stopPropagation();
    if (feeds.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + feeds.length) % feeds.length);
  };

  // Cycle widget size presets
  const handleCycleSize = (e) => {
    e?.stopPropagation();
    setSize((prev) => {
      if (prev === 'sm') return 'md';
      if (prev === 'md') return 'lg';
      return 'sm';
    });
  };

  // Draggable Header logic
  const handlePointerDown = (e) => {
    // Only drag from header handle/bar, not when clicking buttons
    if (e.target.closest('button')) return;
    e.preventDefault();
    setIsDragging(true);

    const widgetRect = widgetRef.current?.getBoundingClientRect();
    const containerRect = containerRef?.current?.getBoundingClientRect() || {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };

    const currentX = position
      ? position.x
      : widgetRect
      ? widgetRect.left - containerRect.left
      : 24;
    const currentY = position
      ? position.y
      : widgetRect
      ? widgetRect.top - containerRect.top
      : 24;

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: currentX,
      startY: currentY
    };

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.pointerX;
      const dy = moveEvent.clientY - dragStartRef.current.pointerY;

      const cRect = containerRef?.current?.getBoundingClientRect() || {
        width: window.innerWidth,
        height: window.innerHeight
      };
      const wRect = widgetRef.current?.getBoundingClientRect() || {
        width: 288,
        height: 176
      };

      const maxX = Math.max(0, cRect.width - wRect.width - 16);
      const maxY = Math.max(0, cRect.height - wRect.height - 16);

      const nextX = Math.max(16, Math.min(maxX, dragStartRef.current.startX + dx));
      const nextY = Math.max(16, Math.min(maxY, dragStartRef.current.startY + dy));

      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  if (!isOpen || feeds.length === 0) return null;

  // Resolve avatar for fallback when camera is off
  const avatarObj =
    AVATAR_OPTIONS.find((a) => a.id === currentFeed?.avatarId) || AVATAR_OPTIONS[0];

  // Size preset classes
  const sizeClasses = {
    sm: 'w-56 h-36',
    md: 'w-72 h-44',
    lg: 'w-96 h-58'
  }[size] || 'w-72 h-44';

  const sizeLabel = {
    sm: 'Small',
    md: 'Medium',
    lg: 'Large'
  }[size];

  // =========================================================================
  // 1. MINIMIZED FLOATING PILL
  // =========================================================================
  if (isMinimized) {
    return (
      <div
        ref={widgetRef}
        onClick={() => setIsMinimized(false)}
        className="absolute top-6 right-6 z-40 flex items-center gap-2.5 bg-[#12171c]/90 hover:bg-[#1b2229] border border-white/15 hover:border-[#ff7a00]/50 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md cursor-pointer transition-all active:scale-95 group select-none animate-fade-in"
        title="Click to restore Picture-in-Picture video"
      >
        <span className="w-2 h-2 rounded-full bg-[#ff7a00] group-hover:scale-125 transition-transform" />
        <Users className="w-3.5 h-3.5 text-[#ff7a00]" />
        <span className="text-xs font-semibold text-white">
          {feeds.length} in call
        </span>

        {hasActiveSpeaker && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Speaking
          </span>
        )}

        <div className="flex items-center gap-1 pl-1 border-l border-white/10 text-white/70 group-hover:text-white transition-colors">
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">
            Restore
          </span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. EXPANDED FLOATING PICTURE-IN-PICTURE CARD
  // =========================================================================
  return (
    <div
      ref={widgetRef}
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px` }
          : undefined
      }
      className={`absolute z-40 ${
        !position ? 'top-6 right-6' : ''
      } ${sizeClasses} flex flex-col bg-[#12171c]/95 border ${
        currentFeed?.isSpeaking
          ? 'ring-2 ring-emerald-500 border-emerald-500/50 shadow-emerald-500/25'
          : 'border-white/15 hover:border-white/30'
      } rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl transition-[width,height,box-shadow] duration-200 group select-none animate-fade-in`}
    >
      {/* PiP Card Header: Drag Handle, Active Name & Controls */}
      <div
        onPointerDown={handlePointerDown}
        className={`h-8 px-2.5 bg-black/60 border-b border-white/10 flex items-center justify-between gap-1.5 shrink-0 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Left: Drag Grip & Feed Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <GripHorizontal className="w-3.5 h-3.5 text-[#9aa6af] shrink-0" />
          <span className="text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[130px]">
            {currentFeed?.displayName || currentFeed?.userName || 'Viewer'}
          </span>
          {feeds.length > 1 && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/80 shrink-0">
              {safeIndex + 1}/{feeds.length}
            </span>
          )}
        </div>

        {/* Right: Actions (Downward Cycle Arrow, Resize, Minimize, Close) */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Multiple Videos Navigation: Downward & Upward Arrows */}
          {feeds.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevFeed}
                className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Previous participant"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextFeed}
                className="p-1 rounded-md hover:bg-[#ff7a00]/20 text-[#ff7a00] hover:text-[#ff9e3b] transition-colors cursor-pointer font-bold"
                title="Next participant (Click downward arrow to cycle one by one)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Resize Toggle Button (sm -> md -> lg) */}
          <button
            type="button"
            onClick={handleCycleSize}
            className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title={`Resize PiP (Currently ${sizeLabel} - click to toggle size)`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Minimize PiP to floating pill"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-md hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors cursor-pointer"
              title="Close PiP"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* PiP Card Body: Video Display or Avatar Fallback */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={true} // Audio is handled by parent WebRTC mesh/AudioContext to prevent echo
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            currentFeed?.isVideoEnabled ? 'opacity-100' : 'opacity-0'
          } ${currentFeed?.isLocal ? 'scale-x-[-1]' : ''}`}
        />

        {/* Camera Off Avatar Fallback */}
        {!currentFeed?.isVideoEnabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#141a1f] to-[#080d10] text-[#9aa6af] p-2">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${avatarObj.bg} border-2 border-white/20 flex items-center justify-center text-2xl sm:text-3xl shadow-glow-orange`}
            >
              {avatarObj.emoji}
            </div>
            <span className="mt-1.5 text-xs font-bold text-white tracking-wide truncate max-w-[140px]">
              {currentFeed?.displayName || currentFeed?.userName}
            </span>
            <span className="text-[9px] text-[#9aa6af] uppercase tracking-wider font-semibold mt-0.5">
              Camera Off
            </span>
          </div>
        )}

        {/* Overlaid Prominent Downward Arrow (Cycle One by One on Click) */}
        {feeds.length > 1 && (
          <button
            type="button"
            onClick={handleNextFeed}
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-[#ff7a00] text-white border border-white/20 hover:border-transparent backdrop-blur-md transition-all shadow-lg cursor-pointer active:scale-90 opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Next video (cycle one by one)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* Bottom Status Badges inside Video Area */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none">
          {/* Speaking Audio Pulse */}
          {currentFeed?.isSpeaking && (
            <div className="bg-emerald-500/90 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Speaking</span>
            </div>
          )}

          {/* Mic Off Badge */}
          {!currentFeed?.isAudioEnabled && (
            <div className="bg-red-500/90 text-white p-1 rounded-md shadow backdrop-blur-md">
              <MicOff className="w-3 h-3" />
            </div>
          )}

          {/* Video Off Badge */}
          {!currentFeed?.isVideoEnabled && (
            <div className="bg-[#1b2229]/90 text-[#9aa6af] p-1 rounded-md shadow backdrop-blur-md border border-white/10">
              <VideoOff className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
