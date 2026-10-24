import { roomManager } from '../rooms.js';
import { torrentManager } from '../torrentManager.js';
import { verifyFirebaseIdToken } from '../services/authVerifier.js';

/**
 * Registers room membership, authentication check, departure, and disconnection handlers.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerRoomHandlers(io, socket) {
  // User requests to join a room (strictly requires authenticated & verified credentials)
  socket.on(
    'join-room',
    async ({ roomId, idToken, userId, userName, avatarId, audioEnabled, videoEnabled }, callback) => {
      if (!roomId) {
        if (typeof callback === 'function') callback({ error: 'Room ID is required' });
        return;
      }
      if (!userId) {
        if (typeof callback === 'function') callback({ error: 'Authentication required. Please sign up or log in.' });
        return;
      }

      // Zero-Trust ID Token Verification
      if (idToken) {
        const authResult = await verifyFirebaseIdToken(idToken, userId);
        if (!authResult.valid) {
          console.warn(
            `[Room Security] Rejected unverified token from socket ${socket.id} claiming UID "${userId}": ${authResult.error}`
          );
          if (typeof callback === 'function') {
            callback({ error: `Authentication failed: ${authResult.error}` });
          }
          return;
        }
      } else if (process.env.NODE_ENV === 'production') {
        console.warn(
          `[Room Security] Rejected unauthenticated connection without ID token from socket ${socket.id}`
        );
        if (typeof callback === 'function') {
          callback({ error: 'Authentication failed: Missing verified ID token.' });
        }
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

    // If user opened this room from another tab, gracefully transfer session and retire old socket
    if (peer.supersededSocketId) {
      const oldSocketId = peer.supersededSocketId;
      console.log(
        `[Room] User ${peer.userName} (${peer.userId}) opened another tab. Superseding old socket: ${oldSocketId}`
      );
      io.to(oldSocketId).emit('session-transferred', {
        reason: 'This watch party was opened in another tab or window.'
      });
      const oldSocket = io.sockets.sockets?.get ? io.sockets.sockets.get(oldSocketId) : null;
      if (oldSocket) {
        oldSocket.leave(channel);
      }
      roomManager.leaveRoom(cleanRoomId, oldSocketId);
      socket.to(channel).emit('peer-left', { socketId: oldSocketId });
      if (peer.isHost) {
        socket.to(channel).emit('host-changed', {
          hostSocketId: socket.id,
          hostUserName: peer.userName
        });
      }
    }

    // Fetch all existing peers in this room except the joining user
    const existingPeers = roomManager.getPeersInRoom(cleanRoomId, socket.id);
    const hostSocketId = roomManager.getRoomHost(cleanRoomId);
    const currentMedia = roomManager.getMediaState(cleanRoomId);

    // Sanitize peers for public delivery: never leak private internal userIds to other peers (#10)
    const sanitizePublicPeer = (p) => ({
      socketId: p.socketId,
      userName: p.userName,
      avatarId: p.avatarId,
      audioEnabled: p.audioEnabled,
      videoEnabled: p.videoEnabled,
      isHost: p.isHost
    });

    const publicPeers = existingPeers.map(sanitizePublicPeer);
    const publicSelf = sanitizePublicPeer(peer);

    console.log(
      `[Room] ${peer.userName} (${socket.id}) joined room "${cleanRoomId}". Host: ${peer.isHost ? 'YES' : 'NO'}. Existing peers: ${existingPeers.length}`
    );

    // Respond back to joining user with their current peer info, existing peers, and active media state
    if (typeof callback === 'function') {
      callback({
        success: true,
        self: peer,
        peers: publicPeers,
        isHost: peer.isHost,
        hostSocketId,
        media: currentMedia
      });
    }

    // Notify other peers in this room that a newcomer has joined (with private credentials stripped)
    socket.to(channel).emit('peer-joined', publicSelf);
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
