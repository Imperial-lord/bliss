import { describe, test, assert, scheduleAutoRun, before, after } from '../harness.mjs';
import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { io } from 'socket.io-client';
import { setupSocketEvents } from '../../src/socketEvents.js';

scheduleAutoRun();

describe('WebRTC Mesh Signaling, Zero-Trust Auth & Injection Shielding', () => {
  let server;
  let ioServer;
  let SERVER_URL;
  let client1;
  let client2;
  const roomId = 'sec-mesh-room-' + Date.now();

  before(async () => {
    const app = express();
    server = http.createServer(app);
    ioServer = new Server(server, { cors: { origin: '*' } });
    setupSocketEvents(ioServer);

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    SERVER_URL = `http://localhost:${port}`;

    client1 = io(SERVER_URL, { transports: ['websocket'] });
    client2 = io(SERVER_URL, { transports: ['websocket'] });

    await new Promise((resolve) => {
      if (client1.connected) resolve();
      else client1.once('connect', resolve);
    });
    await new Promise((resolve) => {
      if (client2.connected) resolve();
      else client2.once('connect', resolve);
    });
  });

  after(async () => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('Unauthenticated client attempting to join without userId or ID token is rejected', async () => {
    const res = await new Promise((resolve) => {
      client1.emit('join-room', {
        roomId,
        userName: 'Hacker'
      }, resolve);
    });

    assert.ok(res.error, 'Unauthenticated join must return error');
    assert.ok(
      res.error.includes('Authentication required') || res.error.includes('Authentication failed'),
      `Expected auth error, got: ${res.error}`
    );
  });

  test('Forged or mismatched Firebase ID token is rejected by Zero-Trust verification', async () => {
    const res = await new Promise((resolve) => {
      client1.emit('join-room', {
        roomId,
        userId: 'uid_alice',
        idToken: 'mock_id_token_forged_attacker_789',
        userName: 'AliceAttacker'
      }, resolve);
    });

    assert.ok(res.error, 'Forged ID token must be rejected');
    assert.ok(res.error.includes('Authentication failed'));
  });

  test('Verified user Alice authenticates and joins room as Host with avatar', async () => {
    const res = await new Promise((resolve) => {
      client1.emit('join-room', {
        roomId,
        userId: 'uid_alice_valid',
        idToken: 'mock_id_token_uid_alice_valid',
        userName: 'Alice',
        avatarId: 'cyber-rebel',
        audioEnabled: true,
        videoEnabled: true
      }, resolve);
    });

    assert.equal(res.success, true);
    assert.equal(res.isHost, true, 'First peer must be designated host');
    assert.equal(res.peers.length, 0, 'First peer has no existing peers');
  });

  test('Verified user Bob joins room as Viewer and receives sanitized peer list without userIds', async () => {
    const peerJoinedPromise = new Promise((resolve) => {
      client1.once('peer-joined', resolve);
    });

    const res = await new Promise((resolve) => {
      client2.emit('join-room', {
        roomId,
        userId: 'uid_bob_valid',
        idToken: 'mock_id_token_uid_bob_valid',
        userName: 'Bob',
        avatarId: 'star-voyager',
        audioEnabled: true,
        videoEnabled: true
      }, resolve);
    });

    assert.equal(res.success, true);
    assert.equal(res.isHost, false, 'Second peer must be viewer');
    assert.equal(res.peers.length, 1);
    assert.equal(res.peers[0].userName, 'Alice');
    assert.equal(res.peers[0].avatarId, 'cyber-rebel');
    assert.equal(
      res.peers[0].userId,
      undefined,
      'Private userId must be withheld from peer responses'
    );

    const newcomer = await peerJoinedPromise;
    assert.equal(newcomer.userName, 'Bob');
    assert.equal(newcomer.avatarId, 'star-voyager');
    assert.equal(
      newcomer.userId,
      undefined,
      'Private userId must be withheld from peer-joined event'
    );
  });

  test('WebRTC signal is relayed to target peer and room channel injection is blocked', async () => {
    const signalPromise = new Promise((resolve) => {
      client1.once('receive-signal', resolve);
    });

    // Valid relay
    client2.emit('signal', {
      to: client1.id,
      signal: { type: 'offer', sdp: 'fake-sdp-test' }
    });

    const offer = await signalPromise;
    assert.equal(offer.from, client2.id);
    assert.equal(offer.signal.sdp, 'fake-sdp-test');

    // Attempt channel injection
    let injected = false;
    client1.once('receive-signal', () => {
      injected = true;
    });
    client2.emit('signal', {
      to: `room:${roomId}`,
      signal: { type: 'offer', sdp: 'injection-test' }
    });

    await new Promise((r) => setTimeout(r, 20));
    assert.equal(injected, false, 'Broadcast to room channel must be blocked');
  });

  test('Multi-tab session transfer delivers session-transferred to Tab 1 and retains host in Tab 2', async () => {
    const clientAliceTab2 = io(SERVER_URL, { transports: ['websocket'] });
    await new Promise((resolve) => {
      if (clientAliceTab2.connected) resolve();
      else clientAliceTab2.once('connect', resolve);
    });

    const sessionTransferredPromise = new Promise((resolve) => {
      client1.once('session-transferred', resolve);
    });

    const joinTab2 = await new Promise((resolve) => {
      clientAliceTab2.emit('join-room', {
        roomId,
        userId: 'uid_alice_valid',
        idToken: 'mock_id_token_uid_alice_valid',
        userName: 'Alice',
        avatarId: 'cyber-rebel',
        audioEnabled: true,
        videoEnabled: true
      }, resolve);
    });

    const notice = await sessionTransferredPromise;
    assert.ok(notice.reason, 'Session transfer event must be delivered to Tab 1');
    assert.equal(joinTab2.isHost, true, 'Tab 2 must retain host authority');
    assert.equal(joinTab2.peers.length, 1);
    assert.equal(joinTab2.peers[0].userName, 'Bob');

    clientAliceTab2.disconnect();
  });
});
