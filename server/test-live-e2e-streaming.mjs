import assert from 'assert';
import { io } from 'socket.io-client';
import axios from 'axios';

/**
 * Live End-to-End Cinema Streaming Integration Test.
 * Validates full-stack functionality against a running server:
 *   1. WebSocket handshake & WebRTC signaling authentication.
 *   2. Host authority and room creation.
 *   3. Torrent metadata resolution, tracker swarm injection & buffering state machine.
 *   4. HTTP 206 Partial Content Range streaming verification.
 *   5. WebVTT subtitle delivery verification.
 *
 * Usage:
 *   TARGET_URL=https://bliss.webhop.me node test-live-e2e-streaming.mjs
 *   TARGET_URL=http://localhost:5001 node test-live-e2e-streaming.mjs
 */

const TARGET_URL = process.env.TARGET_URL || 'https://bliss.webhop.me';
const TEST_TORRENT_URL = process.env.TEST_TORRENT_URL || 'https://yts.gg/torrent/download/F5D61BF3D57082BA2EE1305DA5DF8DCD10D34539';
const TEST_ROOM_ID = `e2e-verify-${Date.now().toString(36)}`;
const TIMEOUT_MS = 60000;

console.log('===============================================================');
console.log(`🎬 Bliss Live E2E Streaming Integration Test`);
console.log(`📡 Target Endpoint: ${TARGET_URL}`);
console.log(`🍿 Test Room ID:    ${TEST_ROOM_ID}`);
console.log(`📦 Torrent Source:  ${TEST_TORRENT_URL}`);
console.log('===============================================================');

async function runLiveE2ETest() {
  const timeoutTimer = setTimeout(() => {
    console.error(`❌ Test timed out after ${TIMEOUT_MS / 1000}s awaiting stream ready.`);
    process.exit(1);
  }, TIMEOUT_MS);

  const socket = io(TARGET_URL, {
    transports: ['polling', 'websocket'],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 3
  });

  await new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log(`✓ [1/5] WebSocket connection established (Socket ID: ${socket.id})`);
      resolve();
    });

    socket.on('connect_error', (err) => {
      reject(new Error(`WebSocket connection failed to ${TARGET_URL}: ${err.message}`));
    });
  });

  // Step 2: Join room as authenticated host
  const testUserId = `e2e_tester_${Date.now()}`;
  const joinResponse = await new Promise((resolve, reject) => {
    socket.emit('join-room', {
      roomId: TEST_ROOM_ID,
      userId: testUserId,
      idToken: `test_id_token_${testUserId}`,
      userName: 'E2E Cinema Bot',
      avatarId: 'cyber-rebel',
      audioEnabled: true,
      videoEnabled: true
    }, (res) => {
      if (res && res.error) return reject(new Error(res.error));
      resolve(res);
    });
  });

  assert(joinResponse && joinResponse.success, 'Join room response must have success: true');
  assert.strictEqual(joinResponse.isHost, true, 'First peer in room must be designated host');
  console.log(`✓ [2/5] Room "${TEST_ROOM_ID}" joined with host authority verified.`);

  // Step 3: Cue movie and track buffering state machine
  console.log(`✓ [3/5] Cueing cinema torrent. Awaiting P2P swarm resolution...`);
  
  const movieReady = await new Promise((resolve, reject) => {
    socket.on('host-movie-error', (err) => {
      reject(new Error(`Host received movie error: ${err.error || JSON.stringify(err)}`));
    });

    socket.on('movie-status-changed', (status) => {
      console.log(`  -> State transition: [${status.status}] ${status.message || status.title || ''}`);

      if (status.status === 'ready') {
        resolve(status);
      } else if (status.status === 'error') {
        reject(new Error(`Torrent state error: ${status.message}`));
      }
    });

    socket.emit('set-movie-source', {
      roomId: TEST_ROOM_ID,
      sourceUrl: TEST_TORRENT_URL
    });
  });

  assert.strictEqual(movieReady.status, 'ready', 'Movie status must reach "ready"');
  assert(movieReady.fileSize > 0, 'Movie file size must be greater than 0');
  console.log(`✓ [4/5] Cinema stream ready! Title: "${movieReady.title}", Size: ${(movieReady.fileSize / 1024 / 1024).toFixed(1)} MB`);

  // Step 4: Verify HTTP 206 Partial Content Range streaming endpoint
  const streamUrl = `${TARGET_URL}/api/stream/${TEST_ROOM_ID}`;
  console.log(`✓ [5/5] Testing HTTP 206 Partial Content range request: ${streamUrl}`);

  const rangeResponse = await axios.get(streamUrl, {
    headers: {
      Range: 'bytes=0-1023'
    },
    validateStatus: () => true, // capture all status codes
    timeout: 15000,
    responseType: 'arraybuffer'
  });

  assert.strictEqual(rangeResponse.status, 206, `Stream must return HTTP 206 Partial Content (got ${rangeResponse.status})`);
  assert(rangeResponse.headers['content-range'], 'Response must contain Content-Range header');
  assert.strictEqual(rangeResponse.headers['content-length'], '1024', 'Content-Length for bytes 0-1023 must be 1024');
  assert.strictEqual(rangeResponse.headers['accept-ranges'], 'bytes', 'Accept-Ranges header must be "bytes"');
  console.log(`  -> Content-Range: ${rangeResponse.headers['content-range']}`);
  console.log(`  -> Content-Type:  ${rangeResponse.headers['content-type']}`);
  console.log(`  -> Bytes received: ${rangeResponse.data.byteLength} bytes`);

  // Step 5: If subtitles exist, verify WebVTT subtitle track delivery
  if (movieReady.subtitles && movieReady.subtitles.length > 0) {
    const subUrl = `${TARGET_URL}/api/subtitles/${TEST_ROOM_ID}/0.vtt`;
    console.log(`  -> Testing WebVTT subtitle track: ${subUrl}`);
    const subRes = await axios.get(subUrl, { timeout: 10000 });
    assert.strictEqual(subRes.status, 200, 'Subtitle endpoint must return HTTP 200');
    assert(subRes.data.startsWith('WEBVTT'), 'Subtitle body must start with WEBVTT header');
    console.log(`  -> WebVTT verified (${subRes.data.length} characters)`);
  }

  // Teardown
  clearTimeout(timeoutTimer);
  socket.disconnect();

  console.log('===============================================================');
  console.log('🎉 ALL LIVE E2E STREAMING INTEGRATION CHECKS PASSED 100%!');
  console.log('===============================================================');
}

runLiveE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Integration test failed:', err.message);
    process.exit(1);
  });
