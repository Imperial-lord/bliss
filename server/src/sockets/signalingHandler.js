import { roomManager } from '../rooms.js';

/**
 * Registers WebRTC signaling and media-toggle socket event listeners.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerSignalingHandlers(io, socket) {
  // Helper to verify that target is a valid socket and shares at least one room with the sender (#10)
  const canRelayTo = (targetSocketId) => {
    if (!targetSocketId || typeof targetSocketId !== 'string') return false;
    // Reject channel injection (e.g. room:xyz)
    if (targetSocketId.includes(':')) return false;

    // Verify sender and target share at least one active room
    const senderRooms = roomManager.getRoomsForSocket(socket.id);
    if (!senderRooms || senderRooms.length === 0) return false;

    const targetRooms = roomManager.getRoomsForSocket(targetSocketId);
    if (!targetRooms || targetRooms.length === 0) return false;

    return senderRooms.some((r) => targetRooms.includes(r));
  };

  // Relay WebRTC Offer / Answer signal
  socket.on('signal', ({ to, signal }) => {
    if (!to || !signal || !canRelayTo(to)) return;
    io.to(to).emit('receive-signal', {
      from: socket.id,
      signal
    });
  });

  // Relay WebRTC ICE Candidate
  socket.on('ice-candidate', ({ to, candidate }) => {
    if (!to || !candidate || !canRelayTo(to)) return;
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
}
