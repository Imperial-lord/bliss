# Bliss 🎬🍿

> **Direct P2P Cinema Streaming & Multi-Peer Video Calls — Live & In Sync.**

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![Node: >=20](https://img.shields.io/badge/Node-%3E%3D20.0.0-blue.svg)](https://nodejs.org)
[![React: 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Mesh-emerald.svg)](https://webrtc.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%203-38bdf8.svg)](https://tailwindcss.com)

Bliss combines synchronized, torrent-powered movie streaming with direct peer-to-peer WebRTC encrypted video and audio calling. Built with an editorial dark obsidian aesthetic inspired by Phenomenon Studio, electric tangerine accents, and sub-second drift synchronization.

---

## ✨ Features

- **🍿 Torrent-Powered Cinema Streaming**:
  - Cue any public `.torrent` download URL or magnet link directly into the room.
  - Sequential streaming with high-availability modern public tracker swarm injection (`opentrackr`, `openbittorrent`, `openwebtorrent`).
  - Pre-buffering of MP4 header containers (`moov`/`ftyp`) for instant HTTP 206 Partial Content range responses.
- **💬 WebVTT Captions Engine**:
  - Automatically extracts `.srt` subtitle files from the torrent archive and converts them to WebVTT on-the-fly.
  - Custom cinematic floating subtitle overlay rendered directly over the player in both windowed and fullscreen modes.
- **👑 Strict Host Authority**:
  - Only the designated room host can cue movies, seek the scrubber, or control play/pause.
  - Non-host peers see smooth buffering/waiting screens with sub-second synchronized timeline tracking.
  - All format errors, invalid links, or network timeouts are delivered strictly and exclusively to the host socket.
  - Dynamic host re-election: if the host disconnects, the next oldest peer is promoted automatically.
- **🎥 Zoom-like Multi-Peer Video Calls**:
  - Mesh WebRTC architecture with ICE candidate queueing to eliminate connection race conditions.
  - Local microphone and camera toggles with audio waveform speech pulses and fallback persona avatars.
  - Floating emoji party reactions and in-room chat.
- **⌨️ Comprehensive Keyboard Controls & Custom Fullscreen**:
  - Spacebar / `K`: Play / Pause toggle.
  - `ArrowLeft` / `J`: Rewind 10 seconds (`-10s`).
  - `ArrowRight` / `L`: Fast-forward 10 seconds (`+10s`).
  - `ArrowUp` / `ArrowDown`: Volume increments/decrements.
  - `M`: Toggle mute.
  - `C`: Toggle captions.
  - `F`: Toggle custom cinema fullscreen with all player controls intact.
  - Input shield automatically suppresses shortcuts when typing in chat or modals.
- **🔒 Privacy First**:
  - Zero storage of chat messages, video frames, or audio streams.
  - High-level session metadata strictly logged for user viewing history via Cloud Firestore.

---

## 🏛️ Architecture Overview

```
bliss/
├── package.json                 # Monorepo runner (concurrent dev, test, build)
├── LICENSE                      # MIT License
├── README.md                    # Project documentation
├── firestore.rules              # Granular Firestore security rules
├── server/                      # Node.js + Express + Socket.IO Backend
│   ├── .env.example             # Server environment variables template
│   ├── src/
│   │   ├── config.js            # Port & CORS configuration
│   │   ├── rooms.js             # Room state, host election & media tracking
│   │   ├── socketEvents.js      # WebRTC signaling relay & cinema control events
│   │   ├── torrentManager.js    # WebTorrent engine, tracker injection & 206 streamer
│   │   └── server.js            # Express server bootstrap & HTTP endpoints
│   ├── test-signaling.mjs       # Multi-peer signaling handshake test suite
│   └── test-torrent-streaming.mjs# Unit test suite for VTT parser & host authority
└── client/                      # Vite + React 18 + Tailwind CSS Frontend
    ├── .env.example             # Client environment variables template
    ├── src/
    │   ├── config/webrtc.js     # STUN ICE configuration & dynamic server URL
    │   ├── constants/avatars.js # 12 cinema persona avatars & favorite genres
    │   ├── services/
    │   │   ├── firebase.js      # Firebase SDK bootstrap (Auth & Firestore)
    │   │   ├── userService.js   # User profiles & auth helpers
    │   │   ├── sessionAnalytics.js # Anonymous cinema session logger
    │   │   └── socket.js        # Socket.IO connection manager
    │   ├── hooks/
    │   │   ├── useMediaStream.js# Mic/Cam media stream manager
    │   │   └── useWebRTC.js     # Mesh WebRTC peer engine & host listeners
    │   └── components/
    │       ├── LandingHero.jsx  # Hero section & action hub
    │       ├── RoomLobby.jsx    # Pre-call A/V preview & room creator
    │       ├── MoviePlayer.jsx  # Synchronized cinema player with HUD & hotkeys
    │       ├── WatchPartyView.jsx # Split stage: Theater screen + Zoom sidebar
    │       └── ZoomVideoSidebar.jsx # Peer video call, reactions & chat panel
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.0.0` or higher (`v22+` recommended)
- **npm**: `v9.0.0` or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/bliss.git
cd bliss
npm run install:all
```

### 2. Configure Environment Variables
Copy the templates into `.env` files:

```bash
# In client directory:
cp client/.env.example client/.env

# In server directory:
cp server/.env.example server/.env
```

Open `client/.env` and supply your **Firebase Web App credentials** from the [Firebase Console](https://console.firebase.google.com/):
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Run Development Servers
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Signaling Server**: [http://localhost:5001](http://localhost:5001)

### 4. Running Test Suites
```bash
npm test
```
Executes:
1. `test-signaling.mjs`: Multi-peer authentication, avatar sync, room isolation, and WebRTC signal exchange.
2. `test-torrent-streaming.mjs`: SRT to WebVTT conversion, room host assignment, seek playback updates, and host re-election.

### 5. Production Build
```bash
npm run build
```
Creates an optimized, minified production bundle in `client/dist/`.

---

## ☁️ Oracle Cloud (OCI Always Free) Deployment Architecture

Bliss is designed to fit 100% within the **Oracle Cloud Infrastructure (OCI) Always Free Tier** ($0/month forever):

```
                          [ Internet: Users / DNS ]
                                     │
                                     ▼ (Ports 80 / 443)
                    +----------------------------------+
                    |  VM 1: Edge Router / SSL Proxy   |
                    |  Shape: VM.Standard.E2.1.Micro   |
                    |  OS: Ubuntu 24.04 (AMD x86_64)   |
                    |  IP: Reserved Static Public IP   |
                    |  Spec: 1 OCPU / 1 GB RAM / 47GB  |
                    +-----------------+----------------+
                                      │
              +-----------------------+-----------------------+
              │ (VCN Internal Network: 10.0.1.0/24)           │
              ▼                                               ▼
+-------------------------------+             +-------------------------------+
| VM 2: Static Web Frontend     |             | VM 3: Signaling & Cinema App  |
| Shape: VM.Standard.E2.1.Micro |             | Shape: VM.Standard.A1.Flex    |
| OS: Ubuntu 24.04 (AMD x86_64) |             | OS: Ubuntu 24.04 (Arm aarch64)|
| Spec: 1 OCPU / 1 GB RAM / 47GB|             | Spec: 1 OCPU / 6 GB RAM / 47GB|
+-------------------------------+             +---------------+---------------+
                                                              │
                                                              ▼
                                              +-------------------------------+
                                              | VM 4: Torrent Ingestion Worker|
                                              | Shape: VM.Standard.A1.Flex    |
                                              | OS: Ubuntu 24.04 (Arm aarch64)|
                                              | Spec: 1 OCPU / 6 GB RAM / 47GB|
                                              +-------------------------------+
```

- **Storage Budget**: 4 VMs × 47 GB Boot Volumes = 188 GB / 200 GB Always Free ceiling.
- **OCI Object Storage**: 20 GB free tier bucket handles cinema stream caching to protect compute disks.
- **Database**: 100% offloaded to Cloud Firestore (zero compute resources spent on local database servers).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
