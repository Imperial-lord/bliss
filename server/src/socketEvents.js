import { registerRoomHandlers } from './sockets/roomHandler.js';
import { registerSignalingHandlers } from './sockets/signalingHandler.js';
import { registerPlaybackHandlers } from './sockets/playbackHandler.js';
import { registerChatHandlers } from './sockets/chatHandler.js';

/**
 * Attaches all modular WebSocket event handlers to the Socket.IO instance.
 *
 * @param {import('socket.io').Server} io
 */
export function setupSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Register modular domain event listeners
    registerRoomHandlers(io, socket);
    registerSignalingHandlers(io, socket);
    registerPlaybackHandlers(io, socket);
    registerChatHandlers(io, socket);
  });
}
