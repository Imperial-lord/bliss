import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';
import RoomLobby from './components/RoomLobby';
import WatchPartyView from './components/WatchPartyView';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import { useMediaStream } from './hooks/useMediaStream';
import { useWebRTC } from './hooks/useWebRTC';
import { getLocalProfile, signOutUser } from './services/userService';

export default function App() {
  // Current logged in user or null
  const [currentUser, setCurrentUser] = useState(() => getLocalProfile());

  // Views: 'landing' | 'lobby' | 'call'
  const [currentView, setCurrentView] = useState('landing');
  const [roomId, setRoomId] = useState('');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signup');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Check URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      setCurrentView('lobby');
    }
  }, []);

  // Manage local camera and audio tracks (active during lobby and call)
  const isMediaNeeded = currentView === 'lobby' || currentView === 'call';
  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    error: mediaError,
    toggleAudio,
    toggleVideo,
    toggleScreenShare
  } = useMediaStream(true, true);

  // WebRTC hook active when in call
  const {
    peers,
    connectionStatus,
    replaceVideoTrack
  } = useWebRTC({
    roomId: currentView === 'call' ? roomId : null,
    userName: currentUser?.displayName || 'Cinephile',
    avatarId: currentUser?.avatarId || 'cyber-rebel',
    localStream,
    isAudioEnabled,
    isVideoEnabled
  });

  const handleOpenAuth = (mode = 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (profile) => {
    setCurrentUser(profile);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  const handleStartWatchParty = () => {
    // Generate unique room code
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const formatted = `${code.slice(0, 3)}-${code.slice(3)}`;
    setRoomId(formatted);
    setCurrentView('lobby');

    const url = new URL(window.location);
    url.searchParams.set('room', formatted);
    window.history.pushState({}, '', url);
  };

  const handleJoinWithCode = (code) => {
    const clean = code.trim().toLowerCase();
    setRoomId(clean);
    setCurrentView('lobby');

    const url = new URL(window.location);
    url.searchParams.set('room', clean);
    window.history.pushState({}, '', url);
  };

  const handleEnterCinemaRoom = (finalRoomId, finalDisplayName) => {
    setRoomId(finalRoomId);
    if (!currentUser) {
      setCurrentUser({
        uid: `guest_${Date.now()}`,
        displayName: finalDisplayName,
        avatarId: 'cyber-rebel',
        bio: 'Cinema explorer',
        favoriteGenres: []
      });
    }
    setCurrentView('call');

    const url = new URL(window.location);
    url.searchParams.set('room', finalRoomId);
    window.history.pushState({}, '', url);
  };

  const handleLeaveCall = () => {
    setCurrentView('landing');
    setRoomId('');
    const url = new URL(window.location);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url);
  };

  const handleToggleScreenShare = () => {
    toggleScreenShare((newTrack) => {
      replaceVideoTrack(newTrack);
    });
  };

  // Render Live Cinema Call View
  if (currentView === 'call') {
    return (
      <WatchPartyView
        roomId={roomId}
        userName={currentUser?.displayName || 'Cinephile'}
        currentUser={currentUser}
        localStream={localStream}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        peers={peers}
        connectionStatus={connectionStatus}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onLeaveCall={handleLeaveCall}
      />
    );
  }

  // Render Room Lobby
  if (currentView === 'lobby') {
    return (
      <>
        <RoomLobby
          initialRoomId={roomId}
          currentUser={currentUser}
          localStream={localStream}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onJoinRoom={handleEnterCinemaRoom}
          onBackToHome={() => {
            setCurrentView('landing');
            const url = new URL(window.location);
            url.searchParams.delete('room');
            window.history.pushState({}, '', url);
          }}
          onOpenAuth={handleOpenAuth}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // Render Bold Landing Screen (Phenomenon Studio Design)
  return (
    <div className="min-h-screen bg-[#080d10] text-[#e9e9e9] selection:bg-[#ff7a00] selection:text-white font-sans flex flex-col">
      <Navbar
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSignOut={handleSignOut}
        onStartWatchParty={handleStartWatchParty}
      />

      <main className="flex-1">
        <LandingHero
          currentUser={currentUser}
          onStartParty={handleStartWatchParty}
          onJoinWithCode={handleJoinWithCode}
        />

        <FeaturesSection onOpenAuth={handleOpenAuth} />
      </main>

      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
