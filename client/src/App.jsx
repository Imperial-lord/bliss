import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import HowItWorksSection from './components/HowItWorksSection';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';
import RoomLobby from './components/RoomLobby';
import WatchPartyView from './components/WatchPartyView';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import { useMediaStream } from './hooks/useMediaStream';
import { useWebRTC } from './hooks/useWebRTC';
import { getLocalProfile, signOutUser, subscribeToAuthState } from './services/userService';

export default function App() {
  // Current authenticated user (verified by Firebase Auth)
  const [currentUser, setCurrentUser] = useState(() => getLocalProfile());

  // Views: 'landing' | 'lobby' | 'call'
  const [currentView, setCurrentView] = useState('landing');
  const [roomId, setRoomId] = useState('');

  // Authentication State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signup');
  const [authModalNotice, setAuthModalNotice] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Stored action to execute immediately once user completes authentication
  const [pendingAction, setPendingAction] = useState(null);

  // Synchronize state with Firebase Auth live listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((profile) => {
      setCurrentUser(profile);
    });
    return () => unsubscribe();
  }, []);

  // Check URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const clean = roomParam.trim().toLowerCase();
      setRoomId(clean);
      if (!currentUser) {
        setPendingAction({ type: 'join', roomId: clean });
        setAuthModalNotice(`Please sign up or log in to enter cinema room "${clean}".`);
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
      } else {
        setCurrentView('lobby');
      }
    }
  }, []);

  // Strict route protection: If unauthenticated, cannot stay in lobby or call
  useEffect(() => {
    if ((currentView === 'lobby' || currentView === 'call') && !currentUser) {
      setCurrentView('landing');
      setAuthModalNotice('Authentication required. Please sign in to access cinema rooms.');
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
    }
  }, [currentView, currentUser]);

  // Manage local camera and audio tracks (strictly only active during lobby and call, NEVER on landing page)
  const isMediaNeeded = (currentView === 'lobby' || currentView === 'call') && !!currentUser;
  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    error: mediaError,
    toggleAudio,
    toggleVideo
  } = useMediaStream({
    enabled: isMediaNeeded,
    initialAudio: true,
    initialVideo: true
  });

  // WebRTC hook active when in call
  const {
    peers,
    connectionStatus
  } = useWebRTC({
    roomId: currentView === 'call' ? roomId : null,
    userId: currentUser?.uid,
    userName: currentUser?.displayName || 'Cinephile',
    avatarId: currentUser?.avatarId || 'cyber-rebel',
    localStream,
    isAudioEnabled,
    isVideoEnabled
  });

  const handleOpenAuth = (mode = 'signup', notice = '') => {
    setAuthModalNotice(notice);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const proceedToHost = useCallback(() => {
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
  }, []);

  const proceedToJoin = useCallback((code) => {
    const clean = code.trim().toLowerCase();
    setRoomId(clean);
    setCurrentView('lobby');

    const url = new URL(window.location);
    url.searchParams.set('room', clean);
    window.history.pushState({}, '', url);
  }, []);

  const handleAuthSuccess = (profile) => {
    setCurrentUser(profile);
    setIsAuthModalOpen(false);
    // Execute pending action if any
    if (pendingAction?.type === 'host') {
      setPendingAction(null);
      proceedToHost();
    } else if (pendingAction?.type === 'join' && pendingAction.roomId) {
      const target = pendingAction.roomId;
      setPendingAction(null);
      proceedToJoin(target);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setCurrentView('landing');
    setRoomId('');
    const url = new URL(window.location);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url);
  };

  // Host a watch party - strictly requires authentication
  const handleStartWatchParty = () => {
    if (!currentUser) {
      setPendingAction({ type: 'host' });
      handleOpenAuth('signup', 'Sign up or sign in to host a cinema watch party.');
      return;
    }
    proceedToHost();
  };

  // Join a room with code - strictly requires authentication
  const handleJoinWithCode = (code) => {
    const clean = code.trim().toLowerCase();
    if (!currentUser) {
      setPendingAction({ type: 'join', roomId: clean });
      handleOpenAuth('signup', `Sign up or sign in to enter cinema room "${clean}".`);
      return;
    }
    proceedToJoin(clean);
  };

  // Enter cinema room from lobby - strictly requires authentication
  const handleEnterCinemaRoom = (finalRoomId) => {
    if (!currentUser) {
      handleOpenAuth('signup', 'Please sign in to enter the cinema room.');
      return;
    }
    setRoomId(finalRoomId);
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
        peers={peers}
        connectionStatus={connectionStatus}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeaveCall={handleLeaveCall}
      />
    );
  }

  // Render Room Lobby (Pre-call A/V preview)
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
        />

        {/* Auth Modal Popup (Consistent max-w-3xl) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          requiredNotice={authModalNotice}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingAction(null);
          }}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // Render Landing Screen
  return (
    <div className="min-h-screen bg-[#080d10] text-[#e9e9e9] selection:bg-[#ff7a00] selection:text-white font-sans flex flex-col">
      <Navbar
        currentUser={currentUser}
        onOpenAuth={(mode) => handleOpenAuth(mode)}
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

        <HowItWorksSection />

        <FeaturesSection onOpenAuth={() => handleOpenAuth('signup')} />
      </main>

      <Footer />

      {/* Auth Modal Popup (Consistent max-w-4xl across all modals) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        requiredNotice={authModalNotice}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile Customization Modal (Consistent max-w-4xl across all modals) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onSignOut={handleSignOut}
        onUpdateProfile={(updated) => setCurrentUser(updated)}
      />
    </div>
  );
}
