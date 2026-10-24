import assert from 'assert';
import { srtToVtt } from './src/torrentManager.js';
import { roomManager } from './src/rooms.js';

console.log('🧪 Starting Torrent & Host Sync Unit Tests...');

// 1. Test SRT to WebVTT conversion
const srtSample = `1
00:01:20,000 --> 00:01:23,456
Welcome to the synchronized cinema.

2
00:01:24,100 --> 00:01:28,900
Stream movies together live.
`;

const vttResult = srtToVtt(srtSample);
assert(vttResult.startsWith('WEBVTT\n\n'), 'WebVTT must start with WEBVTT header');
assert(vttResult.includes('00:01:20.000 --> 00:01:23.456'), 'Timestamp comma must be converted to dot');
assert(vttResult.includes('Welcome to the synchronized cinema.'), 'Subtitle text must be preserved');
console.log('✓ SRT to WebVTT converter verified');

// 2. Test Room Host Authority
const testRoomId = 'test-room-' + Date.now();
const hostPeer = roomManager.joinRoom(testRoomId, 'socket_host_1', {
  userId: 'user_host_1',
  userName: 'CinemaHost'
});

assert.strictEqual(hostPeer.isHost, true, 'First peer in room must be designated host');
assert.strictEqual(roomManager.isHost(testRoomId, 'socket_host_1'), true, 'isHost query must return true for host');

const viewerPeer = roomManager.joinRoom(testRoomId, 'socket_viewer_2', {
  userId: 'user_viewer_2',
  userName: 'CinemaViewer'
});

assert.strictEqual(viewerPeer.isHost, false, 'Second peer in room must not be host');
assert.strictEqual(roomManager.isHost(testRoomId, 'socket_viewer_2'), false, 'isHost query must return false for viewer');
console.log('✓ Host authority assignment verified');

// 3. Test Playback State Updates
roomManager.setRoomMedia(testRoomId, {
  status: 'ready',
  title: 'Test Movie',
  fileSize: 1048576,
  subtitles: [{ index: 0, name: 'en.srt' }]
});

const updatedPlayback = roomManager.updatePlayback(testRoomId, 'play', 45.5);
assert.strictEqual(updatedPlayback.isPlaying, true, 'Playback must be playing');
assert.strictEqual(updatedPlayback.currentTime, 45.5, 'Playback time must match seek position');

const mediaState = roomManager.getMediaState(testRoomId);
assert.strictEqual(mediaState.status, 'ready');
assert.strictEqual(mediaState.title, 'Test Movie');
console.log('✓ Media state and playback tracker verified');

// 4. Test Host Re-assignment on Host Leave
const leaveResult = roomManager.leaveRoom(testRoomId, 'socket_host_1');
assert.strictEqual(leaveResult.newHost.socketId, 'socket_viewer_2', 'Viewer must be promoted to host when original host leaves');
assert.strictEqual(roomManager.isHost(testRoomId, 'socket_viewer_2'), true, 'Promoted peer must have host authority');
console.log('✓ Host re-election on disconnect verified');

// Cleanup
roomManager.leaveRoom(testRoomId, 'socket_viewer_2');
assert.strictEqual(roomManager.rooms.has(testRoomId), false, 'Empty room must be cleaned up');
console.log('✓ Clean room teardown verified');

console.log('🎉 ALL TORRENT & HOST SYNC TESTS PASSED SUCCESSFULLY!');
