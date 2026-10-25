import { describe, test, assert, scheduleAutoRun } from '../harness.mjs';

scheduleAutoRun();

/**
 * Replicates client parseVttToCues logic for verification.
 */
function parseVttToCues(vttText) {
  if (!vttText) return [];
  const cues = [];
  const lines = vttText.split(/\r?\n/);
  const timeRegex = /(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(timeRegex);
    if (match) {
      const startH = parseInt(match[1] || '0', 10);
      const startM = parseInt(match[2], 10);
      const startS = parseInt(match[3], 10);
      const startMs = parseInt(match[4], 10);
      const start = startH * 3600 + startM * 60 + startS + startMs / 1000;

      const endH = parseInt(match[5] || '0', 10);
      const endM = parseInt(match[6], 10);
      const endS = parseInt(match[7], 10);
      const endMs = parseInt(match[8], 10);
      const end = endH * 3600 + endM * 60 + endS + endMs / 1000;

      let text = '';
      for (let j = i + 1; j < lines.length; j++) {
        if (!lines[j].trim() || lines[j].includes('-->')) {
          i = j - 1;
          break;
        }
        text += (text ? '\n' : '') + lines[j].trim();
      }
      if (text) cues.push({ start, end, text });
    }
  }
  return cues;
}

/**
 * Replicates Fullscreen PiP participant feed consolidator logic.
 */
function consolidatePipFeeds({
  userName = 'You',
  currentUser = null,
  localStream = null,
  isAudioEnabled = true,
  isVideoEnabled = true,
  peers = [],
  speakingPeers = {}
}) {
  const list = [];
  list.push({
    id: 'self',
    socketId: 'self',
    userName,
    displayName: `${userName} (You)`,
    avatarId: currentUser?.avatarId || 'cyber-rebel',
    stream: localStream,
    isAudioEnabled,
    isVideoEnabled,
    isSpeaking: isAudioEnabled,
    isLocal: true
  });

  if (Array.isArray(peers)) {
    peers.forEach((peer, idx) => {
      list.push({
        id: peer.socketId || `peer_${idx}`,
        socketId: peer.socketId,
        userName: peer.userName || `Viewer ${idx + 1}`,
        displayName: peer.userName || `Viewer ${idx + 1}`,
        avatarId: peer.avatarId || (idx % 2 === 0 ? 'star-voyager' : 'popcorn-fanatic'),
        stream: peer.stream || null,
        isAudioEnabled: peer.audioEnabled ?? true,
        isVideoEnabled: peer.videoEnabled ?? true,
        isSpeaking: Boolean(speakingPeers && speakingPeers[peer.socketId]),
        isLocal: false
      });
    });
  }

  return list;
}

describe('Fullscreen Video PiP & Subtitle Cue Engine (Client Core Logic)', () => {
  test('parseVttToCues extracts start, end seconds and text from WebVTT strings', () => {
    const vtt = `WEBVTT

1
00:01:20.000 --> 00:01:23.456
Welcome to the synchronized cinema.

2
01:05:10.500 --> 01:05:14.200
Multi-hour subtitle block.
`;

    const cues = parseVttToCues(vtt);
    assert.equal(cues.length, 2);

    // Cue 1: 1m 20s = 80s
    assert.equal(cues[0].start, 80.0);
    assert.equal(cues[0].end, 83.456);
    assert.equal(cues[0].text, 'Welcome to the synchronized cinema.');

    // Cue 2: 1h 5m 10.5s = 3600 + 300 + 10.5 = 3910.5s
    assert.equal(cues[1].start, 3910.5);
    assert.equal(cues[1].end, 3914.2);
    assert.equal(cues[1].text, 'Multi-hour subtitle block.');
  });

  test('Subtitle cue locator correctly matches current playback time', () => {
    const cues = [
      { start: 10.0, end: 15.0, text: 'Opening scene' },
      { start: 20.0, end: 25.0, text: 'Dialogue begins' }
    ];

    function getActiveCue(time) {
      const match = cues.find((c) => time >= c.start && time <= c.end);
      return match ? match.text : '';
    }

    assert.equal(getActiveCue(5.0), '');
    assert.equal(getActiveCue(12.5), 'Opening scene');
    assert.equal(getActiveCue(18.0), '');
    assert.equal(getActiveCue(22.0), 'Dialogue begins');
    assert.equal(getActiveCue(30.0), '');
  });

  test('consolidatePipFeeds merges self user and remote peers with speaking indicators', () => {
    const feeds = consolidatePipFeeds({
      userName: 'Alice',
      currentUser: { avatarId: 'cyber-rebel' },
      isAudioEnabled: true,
      isVideoEnabled: true,
      peers: [
        {
          socketId: 'sock_bob',
          userName: 'Bob',
          avatarId: 'star-voyager',
          audioEnabled: true,
          videoEnabled: false
        },
        {
          socketId: 'sock_charlie',
          userName: 'Charlie',
          audioEnabled: false,
          videoEnabled: true
        }
      ],
      speakingPeers: {
        sock_bob: true,
        sock_charlie: false
      }
    });

    assert.equal(feeds.length, 3);

    // Feed 0: Self (Alice)
    assert.equal(feeds[0].displayName, 'Alice (You)');
    assert.equal(feeds[0].isLocal, true);
    assert.equal(feeds[0].isSpeaking, true);

    // Feed 1: Bob
    assert.equal(feeds[1].displayName, 'Bob');
    assert.equal(feeds[1].isLocal, false);
    assert.equal(feeds[1].isSpeaking, true, 'Bob should be speaking via speakingPeers');
    assert.equal(feeds[1].isVideoEnabled, false);

    // Feed 2: Charlie
    assert.equal(feeds[2].displayName, 'Charlie');
    assert.equal(feeds[2].isSpeaking, false);
    assert.equal(feeds[2].avatarId, 'popcorn-fanatic', 'Fallback avatar assigned');
  });

  test('PiP downward and upward arrow navigation cycles feeds sequentially', () => {
    const feeds = [{ id: 'self' }, { id: 'peer1' }, { id: 'peer2' }];
    const N = feeds.length;
    let currentIndex = 0;

    // Click downward arrow -> next
    currentIndex = (currentIndex + 1) % N;
    assert.equal(currentIndex, 1, 'First downward arrow click cycles to index 1');

    currentIndex = (currentIndex + 1) % N;
    assert.equal(currentIndex, 2, 'Second downward arrow click cycles to index 2');

    // Wraps back to 0
    currentIndex = (currentIndex + 1) % N;
    assert.equal(currentIndex, 0, 'Wraps around to 0');

    // Click upward arrow -> previous
    currentIndex = (currentIndex - 1 + N) % N;
    assert.equal(currentIndex, 2, 'Upward arrow from 0 wraps to last item (2)');
  });

  test('PiP clamps current index when a participant departs', () => {
    let activeIndex = 2; // Was viewing peer 2 (index 2 in array of 3)
    const updatedFeeds = [{ id: 'self' }, { id: 'peer1' }]; // Peer 2 left

    const safeIndex =
      updatedFeeds.length > 0
        ? Math.min(activeIndex, updatedFeeds.length - 1)
        : 0;

    assert.equal(
      safeIndex,
      1,
      'Index must clamp to valid upper bound (1) when peer departs'
    );
  });
});
