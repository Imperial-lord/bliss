import assert from 'assert';
import { ociStorage } from './src/objectStorage.js';

async function testOciObjectStorage() {
  console.log('🧪 Starting OCI Object Storage Native Integration Test...');

  // Wait briefly for init() to resolve
  await new Promise(r => setTimeout(r, 1000));

  if (!ociStorage.isReady) {
    console.log('⚠️ OCI Object Storage credentials not active in this test environment. Skipping live bucket assertions.');
    return;
  }

  console.log(`✓ Connected to OCI namespace: ${ociStorage.namespaceName}, bucket: ${ociStorage.bucketName}`);

  const testInfoHash = 'test_hash_' + Date.now();
  const testSubIndex = 0;
  const testVtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello from OCI Object Storage!';

  console.log('1. Uploading test subtitles to OCI...');
  await ociStorage.saveSubtitles(testInfoHash, testSubIndex, testVtt);

  console.log('2. Reading test subtitles back from OCI...');
  const retrievedVtt = await ociStorage.getSubtitles(testInfoHash, testSubIndex);
  assert.strictEqual(retrievedVtt, testVtt, 'Retrieved WebVTT content must match uploaded content');
  console.log('✓ Subtitle roundtrip verified successfully!');

  console.log('3. Testing streamMovie with HTTP Range request...');
  const mockVideoBuffer = Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz');
  await ociStorage.client.putObject({
    namespaceName: ociStorage.namespaceName,
    bucketName: ociStorage.bucketName,
    objectName: `movies/${testInfoHash}/video.mp4`,
    putObjectBody: mockVideoBuffer,
    contentLength: mockVideoBuffer.length,
    contentType: 'video/mp4'
  });

  const { Writable } = await import('stream');
  const chunks = [];
  let statusCode = null;
  let headers = null;

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
  await new Promise(r => mockRes.on('finish', r));

  assert.strictEqual(statusCode, 206, 'Must respond with HTTP 206 Partial Content');
  assert.strictEqual(Buffer.concat(chunks).toString(), 'ABCDEFGHIJ', 'Streamed chunk must match requested range');
  console.log('✓ streamMovie HTTP 206 range streaming verified successfully!');

  // Cleanup test objects
  try {
    await ociStorage.client.deleteObject({
      namespaceName: ociStorage.namespaceName,
      bucketName: ociStorage.bucketName,
      objectName: `movies/${testInfoHash}/sub_${testSubIndex}.vtt`
    });
    await ociStorage.client.deleteObject({
      namespaceName: ociStorage.namespaceName,
      bucketName: ociStorage.bucketName,
      objectName: `movies/${testInfoHash}/video.mp4`
    });
    console.log('✓ Test objects cleaned up');
  } catch (e) {
    // ignore
  }

  console.log('🎉 ALL OCI OBJECT STORAGE TESTS PASSED 100%!');
}

testOciObjectStorage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ OCI test failed:', err);
    process.exit(1);
  });
