import { describe, test, assert, scheduleAutoRun } from '../harness.mjs';
import { registerChatHandlers } from '../../src/sockets/chatHandler.js';
import { EventEmitter } from 'node:events';

scheduleAutoRun();

/**
 * Creates a mock Socket.IO server & socket pair for isolated unit testing.
 */
function createMockIoSocket() {
  const ioEmissions = [];
  const socketEmissions = [];
  const handlers = new Map();

  const mockIo = {
    to(room) {
      return {
        emit(event, payload) {
          ioEmissions.push({ room, event, payload });
        }
      };
    }
  };

  const mockSocket = {
    id: 'mock_socket_user_999',
    on(event, handler) {
      handlers.set(event, handler);
    },
    emit(event, payload) {
      socketEmissions.push({ event, payload });
    },
    // Test helper to simulate incoming event from client
    trigger(event, data) {
      const handler = handlers.get(event);
      if (handler) handler(data);
    }
  };

  registerChatHandlers(mockIo, mockSocket);

  return {
    socket: mockSocket,
    getIoEmissions: () => ioEmissions,
    clearEmissions: () => {
      ioEmissions.length = 0;
      socketEmissions.length = 0;
    }
  };
}

describe('In-Room Live Chat & Real-Time Reaction Engine', () => {
  const roomId = 'chat-test-room-123';

  test('send-chat broadcasts formatted message with avatarId, unique ID, and timestamp', () => {
    const { socket, getIoEmissions } = createMockIoSocket();

    socket.trigger('send-chat', {
      roomId,
      message: 'Grab the popcorn! 🍿',
      senderName: 'CinemaLover',
      avatarId: 'star-voyager'
    });

    const emissions = getIoEmissions();
    assert.equal(emissions.length, 1);
    assert.equal(emissions[0].room, `room:${roomId}`);
    assert.equal(emissions[0].event, 'receive-chat');

    const chatItem = emissions[0].payload;
    assert.ok(chatItem.id.startsWith('chat_'), 'Chat item must have unique prefixed ID');
    assert.equal(chatItem.senderId, 'mock_socket_user_999');
    assert.equal(chatItem.senderName, 'CinemaLover');
    assert.equal(chatItem.avatarId, 'star-voyager');
    assert.equal(chatItem.message, 'Grab the popcorn! 🍿');
    assert.ok(Date.now() - chatItem.timestamp < 100, 'Timestamp must be current');
  });

  test('send-chat trims whitespace and falls back to default avatar and senderName', () => {
    const { socket, getIoEmissions } = createMockIoSocket();

    socket.trigger('send-chat', {
      roomId,
      message: '   Hello cinema world!   '
    });

    const emissions = getIoEmissions();
    assert.equal(emissions.length, 1);
    const chatItem = emissions[0].payload;
    assert.equal(chatItem.message, 'Hello cinema world!', 'Message must be trimmed');
    assert.equal(chatItem.senderName, 'Viewer', 'Default senderName must be Viewer');
    assert.equal(chatItem.avatarId, 'cyber-rebel', 'Default avatarId must be cyber-rebel');
  });

  test('send-chat drops empty or blank messages without broadcasting', () => {
    const { socket, getIoEmissions } = createMockIoSocket();

    socket.trigger('send-chat', {
      roomId,
      message: ''
    });
    socket.trigger('send-chat', {
      roomId: '',
      message: 'Valid text'
    });

    assert.equal(getIoEmissions().length, 0, 'No emissions should occur for empty chat');
  });

  test('send-reaction broadcasts unique ID and preserves stable xOffset slot for jitter-free rendering', () => {
    const { socket, getIoEmissions } = createMockIoSocket();

    socket.trigger('send-reaction', {
      roomId,
      id: 'react_client_assigned_123',
      emoji: '🔥',
      senderName: 'SuperFan',
      xOffset: 45
    });

    const emissions = getIoEmissions();
    assert.equal(emissions.length, 1);
    assert.equal(emissions[0].room, `room:${roomId}`);
    assert.equal(emissions[0].event, 'receive-reaction');

    const reactionItem = emissions[0].payload;
    assert.equal(
      reactionItem.id,
      'react_client_assigned_123',
      'Reaction must preserve deduplication ID'
    );
    assert.equal(reactionItem.emoji, '🔥');
    assert.equal(reactionItem.senderName, 'SuperFan');
    assert.equal(reactionItem.senderId, 'mock_socket_user_999');
    assert.equal(
      reactionItem.xOffset,
      45,
      'Reaction must preserve stable horizontal offset percentage'
    );
  });

  test('send-reaction generates valid fallback xOffset and ID if omitted by client', () => {
    const { socket, getIoEmissions } = createMockIoSocket();

    socket.trigger('send-reaction', {
      roomId,
      emoji: '👏'
    });

    const emissions = getIoEmissions();
    assert.equal(emissions.length, 1);
    const reactionItem = emissions[0].payload;

    assert.ok(reactionItem.id.startsWith('react_'));
    assert.equal(reactionItem.emoji, '👏');
    assert.equal(reactionItem.senderName, 'Someone');
    assert.ok(
      typeof reactionItem.xOffset === 'number' &&
        reactionItem.xOffset >= 15 &&
        reactionItem.xOffset <= 85,
      `xOffset (${reactionItem.xOffset}) must fall between 15% and 85%`
    );
  });

  test('send-reaction drops empty emoji or missing roomId', () => {
    const { socket, getIoEmissions } = createMockIoSocket();

    socket.trigger('send-reaction', {
      roomId,
      emoji: ''
    });
    socket.trigger('send-reaction', {
      roomId: '',
      emoji: '❤️'
    });

    assert.equal(getIoEmissions().length, 0, 'No emissions for invalid reactions');
  });
});
