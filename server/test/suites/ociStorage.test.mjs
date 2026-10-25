import { describe, test, assert, scheduleAutoRun, before } from '../harness.mjs';
import { ociStorage } from '../../src/objectStorage.js';
import { Writable } from 'node:stream';

scheduleAutoRun();

describe('OCI Object Storage Cloud Persistence & Cache Slicing', () => {
  before(async () => {
    // Await OCI client init
    await new Promise((r) => setTimeout(r, 600));
  });

  test('OCI Object Storage client initializes credentials and verifies bucket connectivity', () => {
    if (!ociStorage.isReady) {
      console.log('    ℹ [Notice] OCI credentials not configured in local environment. Skipping cloud assertions.');
      return;
    }

    assert.ok(ociStorage.namespaceName, 'OCI namespace must be resolved');
    assert.ok(ociStorage.bucketName, 'OCI bucket name must be resolved');
    assert.equal(ociStorage.isReady, true);
  });

  test('Subtitles upload to OCI and roundtrip read matches original WebVTT', async () => {
    if (!ociStorage.isReady) return;

    const testInfoHash = 'test_hash_suite_' + Date.now();
    const testSubIndex = 0;
    const testVtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello from Cloud Suite!';

    await ociStorage.saveSubtitles(testInfoHash, testSubIndex, testVtt);
    const retrieved = await ociStorage.getSubtitles(testInfoHash, testSubIndex);

    assert.equal(retrieved, testVtt, 'Retrieved WebVTT must match uploaded content');
  });

  test('streamMovie serves HTTP 206 partial content from OCI cached video', async () => {
    if (!ociStorage.isReady) return;

    const testInfoHash = 'test_hash_video_' + Date.now();
    const mockBuffer = Buffer.from('BLISS_CINEMA_STREAMING_TEST_BUFFER_1234567890');

    await ociStorage.client.putObject({
      namespaceName: ociStorage.namespaceName,
      bucketName: ociStorage.bucketName,
      objectName: `movies/${testInfoHash}/video.mp4`,
      putObjectBody: mockBuffer,
      contentLength: mockBuffer.length,
      contentType: 'video/mp4'
    });

    const chunks = [];
    let statusCode = null;
    let headers = {};

    const mockRes = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      }
    });
    mockRes.writeHead = (code, h) => {
      statusCode = code;
      headers = h;
    };
    mockRes.setHeader = () => {};

    const mockReq = {
      headers: { range: 'bytes=0-9' },
      on: () => {}
    };

    await ociStorage.streamMovie(testInfoHash, mockReq, mockRes);
    await new Promise((r) => setTimeout(r, 200));

    assert.equal(statusCode, 206);
    assert.equal(headers['Content-Range'], `bytes 0-9/${mockBuffer.length}`);
    assert.equal(headers['Content-Length'], 10);
    assert.equal(Buffer.concat(chunks).length, 10);

    // Clean up test object
    await ociStorage.client.deleteObject({
      namespaceName: ociStorage.namespaceName,
      bucketName: ociStorage.bucketName,
      objectName: `movies/${testInfoHash}/video.mp4`
    });
  });
});
