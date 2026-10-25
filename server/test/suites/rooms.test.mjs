import { describe, test, assert, scheduleAutoRun } from '../harness.mjs';
import { roomManager } from '../../src/rooms.js';

scheduleAutoRun();

describe('Room Management & Host Authority Lifecycle', () => {
  const roomId = 'test-room-lifecycle-' + Date.now();

  test('First peer joining a room is assigned Host authority', () => {
    const peer1 = roomManager.joinRoom(roomId, 'socket_alice_1', {
      userId: 'uid_alice',
      userName: 'Alice',
      avatarId: 'cyber-rebel'
    });

    assert.equal(peer1.isHost, true, 'First peer must be designated host');
    assert.equal(peer1.socketId, 'socket_alice_1');
    assert.equal(peer1.userName, 'Alice');
    assert.equal(peer1.avatarId, 'cyber-rebel');
    assert.equal(roomManager.isHost(roomId, 'socket_alice_1'), true);
  });

  test('Subsequent peers join as viewers (isHost: false)', () => {
    const peer2 = roomManager.joinRoom(roomId, 'socket_bob_2', {
      userId: 'uid_bob',
      userName: 'Bob',
      avatarId: 'star-voyager'
    });

    assert.equal(peer2.isHost, false, 'Subsequent peer must be viewer');
    assert.equal(peer2.socketId, 'socket_bob_2');
    assert.equal(peer2.userName, 'Bob');
    assert.equal(roomManager.isHost(roomId, 'socket_bob_2'), false);

    const peers = roomManager.getPeersInRoom(roomId);
    assert.equal(peers.length, 2, 'Room must contain exactly 2 peers');
  });

  test('Peer data correctly stores avatar and media flags', () => {
    const peer = roomManager.getPeer(roomId, 'socket_bob_2');
    assert.ok(peer, 'Peer must exist in room');
    assert.equal(peer.userName, 'Bob');
    assert.equal(peer.avatarId, 'star-voyager');
    assert.equal(peer.audioEnabled, true);
    assert.equal(peer.videoEnabled, true);
  });

  test('updatePeerMedia updates audio and video states in memory', () => {
    roomManager.updatePeerMedia(roomId, 'socket_bob_2', {
      audioEnabled: false,
      videoEnabled: false
    });

    const peer = roomManager.getPeer(roomId, 'socket_bob_2');
    assert.equal(peer.audioEnabled, false, 'audioEnabled must be updated');
    assert.equal(peer.videoEnabled, false, 'videoEnabled must be updated');

    // Reset back
    roomManager.updatePeerMedia(roomId, 'socket_bob_2', {
      audioEnabled: true,
      videoEnabled: true
    });
  });

  test('Avatar fallback assigns default when invalid or missing avatar provided', () => {
    const peer3 = roomManager.joinRoom(roomId, 'socket_charlie_3', {
      userId: 'uid_charlie',
      userName: 'Charlie'
    });

    assert.equal(peer3.avatarId, 'cyber-rebel', 'Default avatar must be cyber-rebel');
    assert.equal(peer3.isHost, false);
  });

  test('Host promotion delegates authority to next oldest peer when host disconnects', () => {
    const leaveResult = roomManager.leaveRoom(roomId, 'socket_alice_1');

    assert.ok(leaveResult.newHost, 'New host must be promoted upon host departure');
    assert.equal(
      leaveResult.newHost.socketId,
      'socket_bob_2',
      'Oldest remaining peer (Bob) must become new host'
    );
    assert.equal(
      roomManager.isHost(roomId, 'socket_bob_2'),
      true,
      'Bob must now have host authority'
    );
    assert.equal(
      roomManager.isHost(roomId, 'socket_alice_1'),
      false,
      'Departed host must no longer have authority'
    );
  });

  test('Multi-tab session transfer preserves host authority and supersedes old socket', () => {
    // Bob (current host) opens another tab with socket_bob_tab2
    const transferResult = roomManager.joinRoom(roomId, 'socket_bob_tab2', {
      userId: 'uid_bob',
      userName: 'Bob',
      avatarId: 'star-voyager'
    });

    assert.equal(
      transferResult.isHost,
      true,
      'Bob must retain host authority in new tab'
    );
    assert.equal(
      transferResult.supersededSocketId,
      'socket_bob_2',
      'Old socket must be recorded as superseded'
    );

    // In production, the roomHandler leaves the superseded socket
    roomManager.leaveRoom(roomId, transferResult.supersededSocketId);

    // Verify room peers list contains new socket and old socket is removed
    const peers = roomManager.getPeersInRoom(roomId);
    const peerSockets = peers.map((p) => p.socketId);
    assert.ok(
      peerSockets.includes('socket_bob_tab2'),
      'New tab socket must be in room'
    );
    assert.ok(
      !peerSockets.includes('socket_bob_2'),
      'Old tab socket must be eliminated from room'
    );
  });

  test('Empty room is automatically destroyed when all peers disconnect', () => {
    // Leave Charlie
    roomManager.leaveRoom(roomId, 'socket_charlie_3');
    // Leave Bob Tab 2
    roomManager.leaveRoom(roomId, 'socket_bob_tab2');

    assert.equal(
      roomManager.rooms.has(roomId),
      false,
      'Empty room must be deleted from memory'
    );
    assert.equal(
      roomManager.getPeersInRoom(roomId).length,
      0,
      'getPeersInRoom on non-existent room must return empty array'
    );
  });
});
