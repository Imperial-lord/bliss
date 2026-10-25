import { describe, test, assert, scheduleAutoRun } from '../harness.mjs';
import {
  cleanMovieTitle,
  srtToVtt,
  VIDEO_EXTENSIONS,
  SUBTITLE_EXTENSIONS,
  MODERN_TRACKERS
} from '../../src/utils/mediaUtils.js';

scheduleAutoRun();

describe('Cinema Utilities, Subtitles & Release Title Sanitization', () => {
  test('cleanMovieTitle strips scene release tags, codec names, and preserves (Year)', () => {
    const cases = [
      {
        raw: 'The.Dark.Knight.2008.720p.BluRay.x264.YIFY.mp4',
        expected: 'The Dark Knight (2008)'
      },
      {
        raw: 'Inception.2010.1080p.WEBRip.x264-[YTS.AM].mkv',
        expected: 'Inception (2010)'
      },
      {
        raw: 'Interstellar (2014) [1080p] [BluRay] [5.1] [YTS.MX]',
        expected: 'Interstellar (2014)'
      },
      {
        raw: 'Oppenheimer.2023.IMAX.2160p.UHD.HDR.x265.DTS-HD.MA.5.1.mkv',
        expected: 'Oppenheimer (2023)'
      },
      {
        raw: 'Spirited.Away.2001.Japanese.1080p.BluRay.x264.DTS-FGT',
        expected: 'Spirited Away (2001)'
      }
    ];

    for (const { raw, expected } of cases) {
      const result = cleanMovieTitle(raw);
      assert.equal(
        result,
        expected,
        `Expected "${expected}" from "${raw}", got "${result}"`
      );
    }
  });

  test('cleanMovieTitle handles edge cases: null, undefined, empty, or non-year filenames', () => {
    assert.equal(cleanMovieTitle(''), 'Cinema Stream');
    assert.equal(cleanMovieTitle(null), 'Cinema Stream');
    assert.equal(cleanMovieTitle(undefined), 'Cinema Stream');
    assert.equal(
      cleanMovieTitle('Classic.Animation.Shorts.mp4'),
      'Classic Animation Shorts'
    );
  });

  test('srtToVtt converts SRT timestamps and adds standard WEBVTT header', () => {
    const srt = `1
00:01:20,000 --> 00:01:23,456
Welcome to the synchronized cinema.

2
00:01:24,100 --> 00:01:28,900
Stream movies together live.
`;

    const vtt = srtToVtt(srt);

    assert.ok(vtt.startsWith('WEBVTT\n\n'), 'WebVTT must start with standard header');
    assert.ok(
      vtt.includes('00:01:20.000 --> 00:01:23.456'),
      'Timestamp comma must be converted to dot'
    );
    assert.ok(
      vtt.includes('00:01:24.100 --> 00:01:28.900'),
      'Timestamp comma must be converted to dot'
    );
    assert.ok(vtt.includes('Welcome to the synchronized cinema.'));
    assert.ok(vtt.includes('Stream movies together live.'));
  });

  test('Supported video & subtitle extensions contain standard formats', () => {
    assert.ok(VIDEO_EXTENSIONS.includes('.mp4'));
    assert.ok(VIDEO_EXTENSIONS.includes('.mkv'));
    assert.ok(VIDEO_EXTENSIONS.includes('.webm'));
    assert.ok(SUBTITLE_EXTENSIONS.includes('.srt'));
    assert.ok(SUBTITLE_EXTENSIONS.includes('.vtt'));
  });

  test('MODERN_TRACKERS contains modern high-availability public swarm trackers', () => {
    assert.ok(MODERN_TRACKERS.length >= 5, 'Must contain at least 5 trackers');
    assert.ok(MODERN_TRACKERS.some((t) => t.includes('opentrackr.org')));
    assert.ok(MODERN_TRACKERS.some((t) => t.includes('openbittorrent.com')));
    assert.ok(MODERN_TRACKERS.some((t) => t.includes('openwebtorrent.com')));
  });
});
