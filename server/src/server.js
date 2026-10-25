import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PORT, CLIENT_ORIGINS } from './config.js';
import { setupSocketEvents } from './socketEvents.js';
import { roomManager } from './rooms.js';
import { torrentManager } from './torrentManager.js';

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, CI test runners, Node clients)
    if (!origin) return callback(null, true);
    if (CLIENT_ORIGINS.includes('*') || CLIENT_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    if (origin.endsWith('bliss.webhop.me') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
};

app.use(cors(corsOptions));
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
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

setupSocketEvents(io);

// Prevent third-party async timer or socket exceptions from crashing the process
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Process Unhandled Rejection]:', reason);
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Bliss Signaling Server running on port ${PORT}`);
  console.log(`📡 Allowed Origins: ${CLIENT_ORIGINS.join(', ')}`);
  console.log(`===============================================`);
});
