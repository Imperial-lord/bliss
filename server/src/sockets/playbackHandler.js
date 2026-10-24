import { roomManager } from '../rooms.js';
import { torrentManager } from '../torrentManager.js';

/**
 * Registers cinema torrent streaming and synchronized playback socket handlers.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerPlaybackHandlers(io, socket) {
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
}
