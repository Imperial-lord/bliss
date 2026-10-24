import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PORT, CLIENT_ORIGINS } from './config.js';
import { setupSocketEvents } from './socketEvents.js';
import { roomManager } from './rooms.js';
import { torrentManager } from './torrentManager.js';

const app = express();

app.use(cors({
  origin: CLIENT_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeRooms: roomManager.rooms.size
  });
});

// Diagnostic endpoint to inspect rooms (helpful for development)
app.get('/api/rooms', (req, res) => {
  const summary = {};
  for (const [roomId, peers] of roomManager.rooms.entries()) {
    summary[roomId] = Array.from(peers.values()).map(p => ({
      socketId: p.socketId,
      userName: p.userName,
      audioEnabled: p.audioEnabled,
      videoEnabled: p.videoEnabled,
      joinedAt: p.joinedAt
    }));
  }
  res.json({ rooms: summary });
});

// Torrent Video Streaming Endpoint (HTTP 206 Range Requests)
app.get('/api/stream/:roomId', (req, res) => {
  torrentManager.streamVideo(req.params.roomId, req, res);
});

// WebVTT Subtitle Stream Endpoint
app.get('/api/subtitles/:roomId/:index.vtt', (req, res) => {
  torrentManager.streamSubtitle(req.params.roomId, req.params.index, req, res);
});

// Torrent Status Endpoint
app.get('/api/torrent/status/:roomId', (req, res) => {
  const session = torrentManager.getSession(req.params.roomId);
  if (!session) {
    return res.json({ status: 'idle' });
  }
  res.json({
    status: session.status,
    title: session.title,
    fileSize: session.fileSize,
    mimeType: session.mimeType,
    subtitles: session.subtitleFiles.map(s => ({ index: s.index, name: s.name })),
    error: session.error
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

setupSocketEvents(io);

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Bliss Signaling Server running on port ${PORT}`);
  console.log(`📡 Allowed Origins: ${CLIENT_ORIGINS.join(', ')}`);
  console.log(`===============================================`);
});
