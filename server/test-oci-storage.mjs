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

  // Cleanup test object
  try {
    await ociStorage.client.deleteObject({
      namespaceName: ociStorage.namespaceName,
      bucketName: ociStorage.bucketName,
      objectName: `movies/${testInfoHash}/sub_${testSubIndex}.vtt`
    });
    console.log('✓ Test subtitle object cleaned up');
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
