import { roomManager } from '../rooms.js';

/**
 * Registers WebRTC signaling and media-toggle socket event listeners.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerSignalingHandlers(io, socket) {
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
}
