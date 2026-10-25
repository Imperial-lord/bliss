import { describe, test, assert, scheduleAutoRun } from '../harness.mjs';
import { streamVideoResponse } from '../../src/services/streamResponder.js';
import { Readable, Writable } from 'node:stream';

scheduleAutoRun();

/**
 * Creates a mock WebTorrent video file interface.
 * @param {number} fileSize - Total file size in bytes
 */
function createMockVideoFile(fileSize = 5000) {
  const buffer = Buffer.alloc(fileSize, 0x41); // 'A' repeated
  return {
    length: fileSize,
    name: 'movie.mp4',
    createReadStream({ start, end }) {
      const actualEnd = Math.min(end !== undefined ? end + 1 : fileSize, fileSize);
      const actualStart = Math.min(start || 0, actualEnd);
      return Readable.from(buffer.subarray(actualStart, actualEnd));
    }
  };
}

/**
 * Creates mock Express Request and Response objects.
 */
function createMockReqRes({ method = 'GET', range = null }) {
  const headers = {};
  if (range) headers.range = range;

  const req = {
    method,
    headers,
    on: () => {}
  };

  const responseHeaders = {};
  let statusCode = 200;
  const chunks = [];
  let isEnded = false;

  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    }
  });

  res.setHeader = (k, v) => {
    responseHeaders[k.toLowerCase()] = v;
  };
  res.getHeader = (k) => responseHeaders[k.toLowerCase()];
  res.set = (k, v) => {
    responseHeaders[k.toLowerCase()] = v;
    return res;
  };
  res.status = (code) => {
    statusCode = code;
    return res;
  };
  res.sendStatus = (code) => {
    statusCode = code;
    isEnded = true;
    return res;
  };
  res.writeHead = (code, h = {}) => {
    statusCode = code;
    for (const [k, v] of Object.entries(h)) {
      responseHeaders[k.toLowerCase()] = v;
    }
    return res;
  };
  res.json = (body) => {
    chunks.push(Buffer.from(JSON.stringify(body)));
    isEnded = true;
    return res;
  };
  res.end = () => {
    isEnded = true;
  };

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getHeader: (k) => responseHeaders[k.toLowerCase()],
    getHeaders: () => responseHeaders,
    getBody: () => Buffer.concat(chunks),
    isEnded: () => isEnded
  };
}

describe('HTTP 206 Partial Content Range Streaming & Video Slicing', () => {
  const fileSize = 5000;
  const validSession = {
    status: 'ready',
    mimeType: 'video/mp4',
    videoFile: createMockVideoFile(fileSize)
  };

  test('OPTIONS preflight returns HTTP 204 with complete CORS headers', () => {
    const mock = createMockReqRes({ method: 'OPTIONS' });
    streamVideoResponse(validSession, mock.req, mock.res);

    assert.equal(mock.getStatusCode(), 204);
    assert.equal(mock.getHeader('access-control-allow-origin'), '*');
  });

  test('Missing session or non-ready status returns HTTP 404', () => {
    const mock = createMockReqRes({ method: 'GET' });
    streamVideoResponse(null, mock.req, mock.res);

    assert.equal(mock.getStatusCode(), 404);
    assert.ok(mock.getBody().toString().includes('No active video stream'));
  });

  test('Standard range request (bytes=0-1023) returns HTTP 206 and exact 1024 bytes', async () => {
    const mock = createMockReqRes({ method: 'GET', range: 'bytes=0-1023' });
    streamVideoResponse(validSession, mock.req, mock.res);

    // Wait for read stream to pipe
    await new Promise((r) => setTimeout(r, 20));

    assert.equal(mock.getStatusCode(), 206);
    assert.equal(mock.getHeader('content-range'), 'bytes 0-1023/5000');
    assert.equal(mock.getHeader('content-length'), 1024);
    assert.equal(mock.getHeader('accept-ranges'), 'bytes');
    assert.equal(mock.getHeader('content-type'), 'video/mp4');
    assert.equal(mock.getBody().length, 1024);
  });

  test('Open-ended range request (bytes=2000-) returns HTTP 206 through end of file', async () => {
    const mock = createMockReqRes({ method: 'GET', range: 'bytes=2000-' });
    streamVideoResponse(validSession, mock.req, mock.res);

    await new Promise((r) => setTimeout(r, 20));

    assert.equal(mock.getStatusCode(), 206);
    assert.equal(mock.getHeader('content-range'), 'bytes 2000-4999/5000');
    assert.equal(mock.getHeader('content-length'), 3000);
    assert.equal(mock.getBody().length, 3000);
  });

  test('Suffix range request (bytes=-500) slices final 500 bytes without NaN crash', async () => {
    // Crucial bugfix #11: Suffix ranges (bytes=-N) must resolve start = fileSize - N
    const mock = createMockReqRes({ method: 'GET', range: 'bytes=-500' });
    streamVideoResponse(validSession, mock.req, mock.res);

    await new Promise((r) => setTimeout(r, 20));

    assert.equal(mock.getStatusCode(), 206);
    assert.equal(mock.getHeader('content-range'), 'bytes 4500-4999/5000');
    assert.equal(mock.getHeader('content-length'), 500);
    assert.equal(mock.getBody().length, 500);
  });

  test('Range end beyond fileSize (bytes=0-999999) is safely clamped to fileSize - 1', async () => {
    const mock = createMockReqRes({ method: 'GET', range: 'bytes=0-999999' });
    streamVideoResponse(validSession, mock.req, mock.res);

    await new Promise((r) => setTimeout(r, 20));

    assert.equal(mock.getStatusCode(), 206);
    assert.equal(mock.getHeader('content-range'), 'bytes 0-4999/5000');
    assert.equal(mock.getHeader('content-length'), 5000);
    assert.equal(mock.getBody().length, 5000);
  });

  test('Out-of-bounds start (bytes=5000-6000) returns HTTP 416 Range Not Satisfiable', () => {
    const mock = createMockReqRes({ method: 'GET', range: 'bytes=5000-6000' });
    streamVideoResponse(validSession, mock.req, mock.res);

    assert.equal(mock.getStatusCode(), 416);
    assert.equal(mock.getHeader('content-range'), 'bytes */5000');
  });

  test('Inverted range (bytes=1000-500) returns HTTP 416', () => {
    const mock = createMockReqRes({ method: 'GET', range: 'bytes=1000-500' });
    streamVideoResponse(validSession, mock.req, mock.res);

    assert.equal(mock.getStatusCode(), 416);
    assert.equal(mock.getHeader('content-range'), 'bytes */5000');
  });

  test('Invalid suffix range (bytes=-0 or bytes=-abc) returns HTTP 416', () => {
    const mock = createMockReqRes({ method: 'GET', range: 'bytes=-0' });
    streamVideoResponse(validSession, mock.req, mock.res);

    assert.equal(mock.getStatusCode(), 416);
    assert.equal(mock.getHeader('content-range'), 'bytes */5000');
  });
});
