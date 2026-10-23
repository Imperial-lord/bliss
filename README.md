# Bliss 🎬🍿

> Watch movies together while being on real-time peer-to-peer video calls.

Bliss combines synchronized video streaming with direct WebRTC encrypted video and audio calling.

---

## Architecture Overview

```
bliss/
├── package.json                 # Monorepo dev runner with concurrently
├── server/                      # Node.js + Socket.IO Signaling Server
│   ├── src/
│   │   ├── config.js            # Port & CORS settings
│   │   ├── rooms.js             # Room & participant registry
│   │   ├── socketEvents.js      # WebRTC signaling relay (offer, answer, ICE)
│   │   └── server.js            # Express & Socket.io server bootstrap
│   └── test-signaling.mjs       # Automated multi-peer signaling handshake test
└── client/                      # React (Vite) + Tailwind CSS Frontend
    ├── src/
    │   ├── config/webrtc.js     # Public STUN ICE servers configuration
    │   ├── services/socket.js   # Socket.IO connection manager
    │   ├── hooks/
    │   │   ├── useMediaStream.js# Audio/Video track & screen share management
    │   │   └── useWebRTC.js     # Multi-peer WebRTC mesh engine & candidate queue
    │   └── components/
    │       ├── RoomLobby.jsx    # Pre-call A/V preview & room creation
    │       ├── WatchPartyView.jsx # Cinema watch & video call layout
    │       ├── VideoTile.jsx    # Participant video box with mute indicators
    │       ├── MoviePlayer.jsx  # Watch party movie player container
    │       └── CallControls.jsx # Mic, Camera, Screen Share, Invite & Exit
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start Both Server & Client
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Signaling Server**: [http://localhost:5001](http://localhost:5001)

### 3. Running Signaling Tests
```bash
npm test --prefix server
```

---

## Key Features

1. **Pre-call Lobby**: Test microphone and camera, choose username, create or join custom rooms (`?room=xyz`).
2. **Direct P2P Video & Audio**: WebRTC mesh connection between peers with automatic candidate queueing to avoid race conditions.
3. **Dual View Modes**:
   - **Cinema Mode**: Dominant movie player canvas alongside participant video sidebar.
   - **Call Grid Mode**: Dynamic responsive grid adapting to participant count.
4. **Interactive Controls**:
   - Mute/Unmute microphone
   - Turn camera on/off with custom fallback avatar
   - One-click screen sharing
   - Instant invite link copier
   - Clean call teardown
