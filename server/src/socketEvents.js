import { roomManager } from './rooms.js';
import { torrentManager } from './torrentManager.js';

export function setupSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // User requests to join a room (strictly requires authenticated userId)
    socket.on('join-room', ({ roomId, userId, userName, avatarId, audioEnabled, videoEnabled }, callback) => {
      if (!roomId) {
        if (typeof callback === 'function') callback({ error: 'Room ID is required' });
        return;
      }
      if (!userId) {
        if (typeof callback === 'function') callback({ error: 'Authentication required. Please sign up or log in.' });
        return;
      }

      const cleanRoomId = String(roomId).trim();
      const channel = `room:${cleanRoomId}`;

      // Join the socket room channel
      socket.join(channel);

      // Register peer in room manager
      const peer = roomManager.joinRoom(cleanRoomId, socket.id, {
        userId,
        userName: userName?.trim() || `User_${socket.id.substring(0, 4)}`,
        avatarId: avatarId || 'cyber-rebel',
        audioEnabled: audioEnabled ?? true,
        videoEnabled: videoEnabled ?? true
      });

      // Fetch all existing peers in this room except the joining user
      const existingPeers = roomManager.getPeersInRoom(cleanRoomId, socket.id);
      const hostSocketId = roomManager.getRoomHost(cleanRoomId);
      const currentMedia = roomManager.getMediaState(cleanRoomId);

      console.log(`[Room] ${peer.userName} (${socket.id}) joined room "${cleanRoomId}". Host: ${peer.isHost ? 'YES' : 'NO'}. Existing peers: ${existingPeers.length}`);

      // Respond back to joining user with their current peer info, existing peers, and active media state
      if (typeof callback === 'function') {
        callback({
          success: true,
          self: peer,
          peers: existingPeers,
          isHost: peer.isHost,
          hostSocketId,
          media: currentMedia
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

    // =========================================================================
    // CINEMA TORRENT STREAMING & HOST-ONLY CONTROLS
    // =========================================================================

    // Host sets a new movie via torrent link or magnet URI
    socket.on('set-movie-source', async ({ roomId, sourceUrl }) => {
      if (!roomId || !sourceUrl) return;
      const cleanRoomId = String(roomId).trim();
      const channel = `room:${cleanRoomId}`;

      // Strictly verify Host authority
      if (!roomManager.isHost(cleanRoomId, socket.id)) {
        socket.emit('host-movie-error', {
          error: 'Permission denied: Only the room host can cue or change movie streams.'
        });
        return;
      }

      console.log(`[Host Cue] Socket ${socket.id} cued torrent for room "${cleanRoomId}": ${sourceUrl}`);

      // Update room media status to downloading_metadata
      roomManager.setRoomMedia(cleanRoomId, {
        status: 'downloading_metadata',
        sourceUrl,
        title: 'Connecting to swarm...'
      });

      // Broadcast waiting/buffering state to everyone in the room
      io.to(channel).emit('movie-status-changed', {
        status: 'downloading_metadata',
        message: 'Connecting to torrent swarm & resolving stream metadata...'
      });

      try {
        const result = await torrentManager.setMovieSource(
          cleanRoomId,
          sourceUrl,
          (progress) => {
            // Forward intermediate progress to all peers
            io.to(channel).emit('movie-status-changed', progress);
          }
        );

        // Update room state to ready
        roomManager.setRoomMedia(cleanRoomId, {
          status: 'ready',
          title: result.title,
          fileSize: result.fileSize,
          subtitles: result.subtitles,
          playback: {
            isPlaying: false,
            currentTime: 0,
            updatedAt: Date.now()
          }
        });

        // Broadcast ready state to all peers
        io.to(channel).emit('movie-status-changed', {
          status: 'ready',
          title: result.title,
          fileSize: result.fileSize,
          subtitles: result.subtitles
        });
      } catch (err) {
        console.error(`[Torrent Error in room ${cleanRoomId}]:`, err.message);

        roomManager.setRoomMedia(cleanRoomId, {
          status: 'idle',
          title: ''
        });

        // CRITICAL REQUIREMENT: Errors are sent EXCLUSIVELY to the host socket!
        socket.emit('host-movie-error', {
          error: err.message || 'Failed to stream torrent movie.'
        });

        // Other peers simply revert back to the cinema waiting screen
        socket.to(channel).emit('movie-status-changed', {
          status: 'idle',
          title: null
        });
      }
    });

    // Host controls playback (play, pause, seek)
    socket.on('sync-playback', ({ roomId, action, currentTime }) => {
      if (!roomId || !action) return;
      const cleanRoomId = String(roomId).trim();
      const channel = `room:${cleanRoomId}`;

      // Strictly verify Host authority
      if (!roomManager.isHost(cleanRoomId, socket.id)) {
        return; // Non-hosts are ignored
      }

      const updated = roomManager.updatePlayback(cleanRoomId, action, currentTime);

      // Broadcast authoritative playback update to all peers
      socket.to(channel).emit('playback-updated', {
        action,
        currentTime: updated.currentTime,
        updatedAt: updated.updatedAt
      });
    });

    // Peer requests current playback sync (e.g. upon joining or reconnection)
    socket.on('request-playback-sync', ({ roomId }, callback) => {
      if (!roomId) return;
      const cleanRoomId = String(roomId).trim();
      const media = roomManager.getMediaState(cleanRoomId);

      if (media && typeof callback === 'function') {
        callback({
          status: media.status,
          title: media.title,
          subtitles: media.subtitles,
          playback: media.playback
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
      const result = roomManager.leaveRoom(cleanRoomId, socket.id);

      if (result?.peer) {
        console.log(`[Room] ${result.peer.userName} (${socket.id}) left room "${cleanRoomId}"`);
        socket.to(channel).emit('peer-left', { socketId: socket.id });

        if (result.newHost) {
          io.to(channel).emit('host-changed', {
            hostSocketId: result.newHost.socketId,
            hostUserName: result.newHost.userName
          });
        }
        if (result.roomEmpty) {
          torrentManager.destroyRoomTorrent(cleanRoomId);
        }
      }
    });

    // Handle unexpected or connection-drop disconnect
    socket.on('disconnecting', () => {
      const rooms = roomManager.getRoomsForSocket(socket.id);
      for (const roomId of rooms) {
        const channel = `room:${roomId}`;
        const result = roomManager.leaveRoom(roomId, socket.id);

        if (result?.peer) {
          console.log(`[Room] ${result.peer.userName} (${socket.id}) disconnected from room "${roomId}"`);
          socket.to(channel).emit('peer-left', { socketId: socket.id });

          if (result.newHost) {
            io.to(channel).emit('host-changed', {
              hostSocketId: result.newHost.socketId,
              hostUserName: result.newHost.userName
            });
          }
          if (result.roomEmpty) {
            torrentManager.destroyRoomTorrent(roomId);
          }
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });
  });
}
