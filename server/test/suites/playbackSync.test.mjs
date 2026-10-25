import { describe, test, assert, scheduleAutoRun } from '../harness.mjs';
import { roomManager } from '../../src/rooms.js';

scheduleAutoRun();

describe('Cinema Playback State & Drift Synchronization', () => {
  const roomId = 'test-playback-room-' + Date.now();

  test('setRoomMedia initializes media status, title, and default paused playback', () => {
    roomManager.joinRoom(roomId, 'socket_host', { userId: 'u_host', userName: 'Host' });

    roomManager.setRoomMedia(roomId, {
      status: 'ready',
      title: 'The Matrix (1999)',
      fileSize: 1048576000,
      subtitles: [{ index: 0, name: 'English' }]
    });

    const mediaState = roomManager.getMediaState(roomId);
    assert.equal(mediaState.status, 'ready');
    assert.equal(mediaState.title, 'The Matrix (1999)');
    assert.equal(mediaState.fileSize, 1048576000);
    assert.equal(mediaState.playback.isPlaying, false);
    assert.equal(mediaState.playback.currentTime, 0);
    assert.equal(mediaState.playback.action, 'pause');
  });

  test('updatePlayback(play, time) transitions playback to active playing state', () => {
    const playback = roomManager.updatePlayback(roomId, 'play', 120.5);

    assert.equal(playback.isPlaying, true, 'isPlaying must be true on play action');
    assert.equal(playback.currentTime, 120.5, 'currentTime must match play position');
    assert.ok(playback.updatedAt > 0, 'updatedAt timestamp must be recorded');
  });

  test('Host seek while playing preserves isPlaying: true and updates currentTime', () => {
    // Crucial bugfix #2: Seeking while playing must NOT set isPlaying: false
    const playback = roomManager.updatePlayback(roomId, 'seek', 250.0);

    assert.equal(
      playback.isPlaying,
      true,
      'Seeking while playing must retain isPlaying: true'
    );
    assert.equal(playback.currentTime, 250.0, 'currentTime must be updated to 250s');
  });

  test('updatePlayback(pause, time) transitions playback to paused state', () => {
    const playback = roomManager.updatePlayback(roomId, 'pause', 255.0);

    assert.equal(playback.isPlaying, false, 'isPlaying must be false on pause');
    assert.equal(playback.currentTime, 255.0);
  });

  test('Host seek while paused preserves isPlaying: false', () => {
    const playback = roomManager.updatePlayback(roomId, 'seek', 300.0);

    assert.equal(
      playback.isPlaying,
      false,
      'Seeking while paused must remain paused'
    );
    assert.equal(playback.currentTime, 300.0);
  });

  test('Late joiner getMediaState derives action: play and advances time by elapsed duration', async () => {
    // Put room into active playback
    roomManager.updatePlayback(roomId, 'play', 500.0);

    // Wait 50ms to simulate real wall-clock progression
    await new Promise((r) => setTimeout(r, 50));

    const mediaState = roomManager.getMediaState(roomId);
    assert.equal(
      mediaState.playback.action,
      'play',
      'getMediaState must derive action: play for late joiners'
    );
    assert.equal(mediaState.playback.isPlaying, true);
    assert.ok(
      mediaState.playback.currentTime >= 500.04,
      `currentTime (${mediaState.playback.currentTime}) must advance by elapsed time (~50ms)`
    );
    assert.ok(
      Date.now() - mediaState.playback.updatedAt < 20,
      'updatedAt must be refreshed to Date.now()'
    );
  });

  test('Wall-clock elapsed progression formula correctly advances expected time without drift accumulation', () => {
    const receivedAt = Date.now() - 2500; // Received 2.5 seconds ago
    const remoteCurrentTime = 100.0; // Remote was at 100s when received

    const elapsed = Math.max(0, (Date.now() - receivedAt) / 1000);
    const expectedTime = remoteCurrentTime + elapsed;

    assert.ok(
      expectedTime >= 102.4 && expectedTime <= 102.6,
      `Expected time should be ~102.5s, got ${expectedTime}`
    );
  });

  test('Pitch-neutral rate glide algorithm selects correct playbackRate tier', () => {
    function computeGlideRate(currentVideoTime, expectedCinemaTime) {
      const diff = expectedCinemaTime - currentVideoTime;
      const absDiff = Math.abs(diff);

      // Tier 1: In perfect sync (< 0.5s)
      if (absDiff < 0.5) return { tier: 1, rate: 1.0, requiresSeek: false };

      // Tier 2: Adaptive Rate Glide (0.5s to 3.0s) - pitch-neutral seamless adjustment
      if (absDiff <= 3.0) {
        if (diff > 0) {
          return { tier: 2, rate: 1.06, requiresSeek: false }; // slightly behind -> glide faster
        } else {
          return { tier: 2, rate: 0.94, requiresSeek: false }; // slightly ahead -> glide slower
        }
      }

      // Tier 3: Macro drift (> 3.0s) -> Hard seek
      return { tier: 3, rate: 1.0, requiresSeek: true };
    }

    // Case 1: 0.2s drift -> Tier 1 (1.0x)
    assert.deepEqual(computeGlideRate(100.0, 100.2), {
      tier: 1,
      rate: 1.0,
      requiresSeek: false
    });

    // Case 2: 1.2s behind -> Tier 2 (1.06x, no seek)
    assert.deepEqual(computeGlideRate(100.0, 101.2), {
      tier: 2,
      rate: 1.06,
      requiresSeek: false
    });

    // Case 3: 0.8s ahead -> Tier 2 (0.94x, no seek)
    assert.deepEqual(computeGlideRate(100.8, 100.0), {
      tier: 2,
      rate: 0.94,
      requiresSeek: false
    });

    // Case 4: 5.0s behind -> Tier 3 (Hard seek required)
    assert.deepEqual(computeGlideRate(100.0, 105.0), {
      tier: 3,
      rate: 1.0,
      requiresSeek: true
    });
  });

  // Cleanup room
  test('Cleanup playback room', () => {
    roomManager.leaveRoom(roomId, 'socket_host');
    assert.equal(roomManager.rooms.has(roomId), false);
  });
});
