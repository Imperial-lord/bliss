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
  console.log('✓ Client 2 (Bob) joined room and received existing peer with avatar.');

  const newcomer = await peerJoinedPromise;
  if (newcomer.avatarId !== 'star-voyager') {
    throw new Error('Newcomer avatar mismatch: ' + JSON.stringify(newcomer));
  }
  console.log('✓ Client 1 notified of Bob with avatar "star-voyager".');

  // Test Offer Signal relay
  const signalPromise = new Promise((resolve) => {
    client1.on('receive-signal', resolve);
  });

  client2.emit('signal', {
    to: client1.id,
    signal: { type: 'offer', sdp: 'fake-sdp-data' }
  });

  const offer = await signalPromise;
  if (offer.from !== client2.id) {
    throw new Error('Signal relay failed: ' + JSON.stringify(offer));
  }
  console.log('✓ WebRTC Offer signal relayed successfully.');

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
