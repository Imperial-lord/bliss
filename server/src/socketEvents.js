import { roomManager } from './rooms.js';

export function setupSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // User requests to join a room
    socket.on('join-room', ({ roomId, userName, avatarId, audioEnabled, videoEnabled }, callback) => {
      if (!roomId) {
        if (typeof callback === 'function') callback({ error: 'Room ID is required' });
        return;
      }

      const cleanRoomId = String(roomId).trim();
      const channel = `room:${cleanRoomId}`;

      // Join the socket room channel
      socket.join(channel);

      // Register peer in room manager
      const peer = roomManager.joinRoom(cleanRoomId, socket.id, {
        userName: userName?.trim() || `User_${socket.id.substring(0, 4)}`,
        avatarId: avatarId || 'cyber-rebel',
        audioEnabled: audioEnabled ?? true,
        videoEnabled: videoEnabled ?? true
      });

      // Fetch all existing peers in this room except the joining user
      const existingPeers = roomManager.getPeersInRoom(cleanRoomId, socket.id);

      console.log(`[Room] ${peer.userName} (${socket.id}) joined room "${cleanRoomId}". Existing peers: ${existingPeers.length}`);

      // Respond back to joining user with their current peer info and the list of existing peers
      if (typeof callback === 'function') {
        callback({
          success: true,
          self: peer,
          peers: existingPeers
        });
      }

      // Notify other peers in this room that a newcomer has joined
      socket.to(channel).emit('peer-joined', peer);
    });

    // Relay WebRTC Offer / Answer signal
    socket.on('signal', ({ to, signal }) => {
      if (!to || !signal) return;
      io.to(to).emit('receive-signal', {
        from: socket.id,
        signal
      });
    });

    // Relay WebRTC ICE Candidate
    socket.on('ice-candidate', ({ to, candidate }) => {
      if (!to || !candidate) return;
      io.to(to).emit('ice-candidate', {
        from: socket.id,
        candidate
      });
    });

    // Peer toggled mic or camera
    socket.on('media-toggle', ({ roomId, audioEnabled, videoEnabled }) => {
      if (!roomId) return;
      const cleanRoomId = String(roomId).trim();
      const updated = roomManager.updatePeerMedia(cleanRoomId, socket.id, {
        audioEnabled,
        videoEnabled
      });

      if (updated) {
        socket.to(`room:${cleanRoomId}`).emit('peer-media-updated', {
          socketId: socket.id,
          audioEnabled: updated.audioEnabled,
          videoEnabled: updated.videoEnabled
        });
      }
    });

    // In-room live chat message
    socket.on('send-chat', ({ roomId, message, senderName, avatarId }) => {
      if (!roomId || !message) return;
      const cleanRoomId = String(roomId).trim();
      const chatItem = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: socket.id,
        senderName: senderName || 'Viewer',
        avatarId: avatarId || 'cyber-rebel',
        message: String(message).trim(),
        timestamp: Date.now()
      };
      io.to(`room:${cleanRoomId}`).emit('receive-chat', chatItem);
    });

    // Real-time floating emoji reaction
    socket.on('send-reaction', ({ roomId, emoji, senderName }) => {
      if (!roomId || !emoji) return;
      const cleanRoomId = String(roomId).trim();
      io.to(`room:${cleanRoomId}`).emit('receive-reaction', {
        id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        senderName: senderName || 'Someone',
        senderId: socket.id
      });
    });

    // Peer explicitly left a room
    socket.on('leave-room', ({ roomId }) => {
      if (!roomId) return;
      const cleanRoomId = String(roomId).trim();
      const channel = `room:${cleanRoomId}`;

      socket.leave(channel);
      const peer = roomManager.leaveRoom(cleanRoomId, socket.id);

      if (peer) {
        console.log(`[Room] ${peer.userName} (${socket.id}) left room "${cleanRoomId}"`);
        socket.to(channel).emit('peer-left', { socketId: socket.id });
      }
    });

    // Handle unexpected or connection-drop disconnect
    socket.on('disconnecting', () => {
      const rooms = roomManager.getRoomsForSocket(socket.id);
      for (const roomId of rooms) {
        const channel = `room:${roomId}`;
        const peer = roomManager.leaveRoom(roomId, socket.id);
        if (peer) {
          console.log(`[Room] ${peer.userName} (${socket.id}) disconnected from room "${roomId}"`);
          socket.to(channel).emit('peer-left', { socketId: socket.id });
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });
  });
}
