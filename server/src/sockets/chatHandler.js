/**
 * Registers live text chat and real-time floating emoji reaction socket handlers.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
export function registerChatHandlers(io, socket) {
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
  socket.on('send-reaction', ({ roomId, id, emoji, senderName, xOffset }) => {
    if (!roomId || !emoji) return;
    const cleanRoomId = String(roomId).trim();
    io.to(`room:${cleanRoomId}`).emit('receive-reaction', {
      id: id || `react_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      emoji,
      senderName: senderName || 'Someone',
      senderId: socket.id,
      xOffset: typeof xOffset === 'number' ? xOffset : Math.floor(15 + Math.random() * 70)
    });
  });
}
