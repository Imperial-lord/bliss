import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io } from 'socket.io-client';
import { setupSocketEvents } from './src/socketEvents.js';

async function runSelfContainedTest() {
  console.log('Starting self-contained WebRTC signaling test...');

  // Create isolated express + socket.io server
  const app = express();
  const server = http.createServer(app);
  const ioServer = new Server(server, { cors: { origin: '*' } });
  setupSocketEvents(ioServer);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const SERVER_URL = `http://localhost:${port}`;
  console.log(`✓ Test server listening on ephemeral port ${port}`);

  const client1 = io(SERVER_URL, { transports: ['websocket'] });
  const client2 = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((resolve) => client1.on('connect', resolve));
  await new Promise((resolve) => client2.on('connect', resolve));
  console.log('✓ Both clients connected successfully.');

  const roomId = 'phenomenon-room';

  // 1. Verify unauthenticated client is rejected
  const unauthJoin = await new Promise((resolve) => {
    client1.emit('join-room', {
      roomId,
      userName: 'Hacker'
    }, resolve);
  });
  if (!unauthJoin.error) {
    throw new Error('Unauthenticated user was not rejected!');
  }
  console.log('✓ Security check passed: Unauthenticated user rejected by server.');

  // 2. Client 1 joins with authenticated userId and custom cinema avatar
  const join1 = await new Promise((resolve) => {
    client1.emit('join-room', {
      roomId,
      userId: 'firebase_uid_alice_123',
      userName: 'Alice',
      avatarId: 'cyber-rebel',
      audioEnabled: true,
      videoEnabled: true
    }, resolve);
  });

  if (!join1.success || join1.peers.length !== 0 || join1.self.avatarId !== 'cyber-rebel') {
    throw new Error('Client 1 join failed: ' + JSON.stringify(join1));
  }
  console.log('✓ Client 1 (Alice) authenticated & joined room with avatar "cyber-rebel".');

  const peerJoinedPromise = new Promise((resolve) => {
    client1.on('peer-joined', resolve);
  });

  // 3. Client 2 joins with authenticated userId
  const join2 = await new Promise((resolve) => {
    client2.emit('join-room', {
      roomId,
      userId: 'firebase_uid_bob_456',
      userName: 'Bob',
      avatarId: 'star-voyager',
      audioEnabled: true,
      videoEnabled: true
    }, resolve);
  });

  if (!join2.success || join2.peers.length !== 1 || join2.peers[0].avatarId !== 'cyber-rebel') {
    throw new Error('Client 2 join failed or did not receive avatarId: ' + JSON.stringify(join2));
  }
  // Verify private userIds are not leaked in peer responses (#10)
  if (join2.peers[0].userId) {
    throw new Error('Security violation: peer.userId leaked in peers list!');
  }
  console.log('✓ Client 2 (Bob) joined room and received existing peer with avatar (userId safely withheld).');

  const newcomer = await peerJoinedPromise;
  if (newcomer.avatarId !== 'star-voyager') {
    throw new Error('Newcomer avatar mismatch: ' + JSON.stringify(newcomer));
  }
  if (newcomer.userId) {
    throw new Error('Security violation: peer.userId leaked in peer-joined event!');
  }
  console.log('✓ Client 1 notified of Bob with avatar "star-voyager" (credentials protected).');

  // Test Offer Signal relay
  const signalPromise = new Promise((resolve) => {
    client1.on('receive-signal', resolve);
  });

  // Verify rogue channel broadcast is blocked (#10)
  client2.emit('signal', {
    to: 'room:phenomenon-room',
    signal: { type: 'offer', sdp: 'injection-attempt' }
  });

  client2.emit('signal', {
    to: client1.id,
    signal: { type: 'offer', sdp: 'fake-sdp-data' }
  });

  const offer = await signalPromise;
  if (offer.from !== client2.id || offer.signal.sdp !== 'fake-sdp-data') {
    throw new Error('Signal relay failed: ' + JSON.stringify(offer));
  }
  console.log('✓ WebRTC Offer signal relayed successfully (and channel broadcast injection blocked).');

  // 4. Test multi-tab takeover & host retention
  console.log('Testing multi-tab session transfer for Alice (host)...');
  const clientAliceTab2 = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise((resolve) => clientAliceTab2.on('connect', resolve));

  const sessionTransferredPromise = new Promise((resolve) => {
    client1.on('session-transferred', resolve);
  });

  const joinAliceTab2 = await new Promise((resolve) => {
    clientAliceTab2.emit('join-room', {
      roomId,
      userId: 'firebase_uid_alice_123',
      userName: 'Alice',
      avatarId: 'cyber-rebel',
      audioEnabled: true,
      videoEnabled: true
    }, resolve);
  });

  const transferNotice = await sessionTransferredPromise;
  if (!transferNotice?.reason) {
    throw new Error('Session transfer event was not delivered to Tab 1');
  }
  console.log('✓ Tab 1 received session-transferred notice successfully.');

  if (!joinAliceTab2.isHost) {
    throw new Error('Tab 2 did not retain host permissions!');
  }
  console.log('✓ Tab 2 retains host authority across tabs without demotion.');

  // Tab 2 peers should only contain Bob, not old Alice Tab 1
  if (joinAliceTab2.peers.length !== 1 || joinAliceTab2.peers[0].userName !== 'Bob') {
    throw new Error('Tab 2 peer list includes old superseded session or incorrect peers: ' + JSON.stringify(joinAliceTab2.peers));
  }
  console.log('✓ Duplicate self-peer eliminated from active peer list.');

  clientAliceTab2.disconnect();
  client1.disconnect();
  client2.disconnect();
  await new Promise((resolve) => server.close(resolve));
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runSelfContainedTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
