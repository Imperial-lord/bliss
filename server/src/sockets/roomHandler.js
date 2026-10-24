import { roomManager } from '../rooms.js';
import { torrentManager } from '../torrentManager.js';

/**
 * Registers room membership, authentication check, departure, and disconnection handlers.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerRoomHandlers(io, socket) {
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

    console.log(
      `[Room] ${peer.userName} (${socket.id}) joined room "${cleanRoomId}". Host: ${peer.isHost ? 'YES' : 'NO'}. Existing peers: ${existingPeers.length}`
    );

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

  // Handle unexpected connection-drop disconnect
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
}
