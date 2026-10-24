import common from 'oci-common';
import os from 'oci-objectstorage';
import { Readable } from 'stream';

/**
 * Native OCI Object Storage Integration for Bliss Cinema Streaming.
 * Uses official OCI Node.js SDK to cache and stream movies and WebVTT subtitles,
 * offloading compute VM disks and providing instant zero-wait playback for previously cued films.
 */
class OciObjectStorageService {
  constructor() {
    this.client = null;
    this.namespaceName = process.env.OCI_OBJECT_STORAGE_NAMESPACE || 'axxfp6gwj5at';
    this.bucketName = process.env.OCI_OBJECT_STORAGE_BUCKET || 'bliss-cinema-cache';
    this.compartmentId = null;
    this.isReady = false;

    this.init();
  }

  async init() {
    try {
      // 1. Attempt standard ~/.oci/config authentication
      const provider = new common.ConfigFileAuthenticationDetailsProvider();
      this.client = new os.ObjectStorageClient({ authenticationDetailsProvider: provider });
      this.compartmentId = provider.getTenantId();

      // Verify connection & namespace
      const nsRes = await this.client.getNamespace({});
      if (nsRes && nsRes.value) {
        this.namespaceName = nsRes.value;
      }
      this.isReady = true;
      console.log(`[OCI Object Storage] Connected to namespace: "${this.namespaceName}", bucket: "${this.bucketName}"`);
      await this.ensureBucket();
    } catch (err) {
      // If config file is missing (e.g. running locally without ~/.oci/config), check for Instance Principal
      try {
        const provider = new common.InstancePrincipalsAuthenticationDetailsProvider();
        this.client = new os.ObjectStorageClient({ authenticationDetailsProvider: provider });
        const nsRes = await this.client.getNamespace({});
        if (nsRes && nsRes.value) {
          this.namespaceName = nsRes.value;
        }
        this.isReady = true;
        console.log(`[OCI Object Storage] Connected via Instance Principal to namespace: "${this.namespaceName}"`);
        await this.ensureBucket();
      } catch (innerErr) {
        this.isReady = false;
        console.log(`[OCI Object Storage] Native OCI credentials not detected (${err.message}). Torrent streaming will operate in local fallback mode.`);
      }
    }
  }

  /**
   * Ensures the cache bucket exists in OCI Object Storage.
   */
  async ensureBucket() {
    if (!this.isReady || !this.client) return;
    try {
      await this.client.getBucket({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName
      });
    } catch (e) {
      if (e.statusCode === 404 && this.compartmentId) {
        console.log(`[OCI Object Storage] Creating bucket "${this.bucketName}"...`);
        await this.client.createBucket({
          namespaceName: this.namespaceName,
          createBucketDetails: {
            name: this.bucketName,
            compartmentId: this.compartmentId,
            publicAccessType: os.models.CreateBucketDetails.PublicAccessType.NoPublicAccess,
            storageTier: os.models.CreateBucketDetails.StorageTier.Standard
          }
        });
        console.log(`[OCI Object Storage] Created bucket "${this.bucketName}" successfully.`);
      }
    }
  }

  /**
   * Checks if a movie is already cached in OCI Object Storage.
   * @param {string} infoHash
   * @returns {Promise<boolean>}
   */
  async hasMovie(infoHash) {
    if (!this.isReady || !this.client) return false;
    try {
      const objectName = `movies/${infoHash}/video.mp4`;
      const res = await this.client.headObject({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName,
        objectName
      });
      return res && res.contentLength > 0;
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieves metadata (size, content type) for a cached movie.
   */
  async getMovieMetadata(infoHash) {
    if (!this.isReady || !this.client) return null;
    try {
      const objectName = `movies/${infoHash}/video.mp4`;
      const res = await this.client.headObject({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName,
        objectName
      });
      return {
        contentLength: res.contentLength,
        contentType: res.contentType || 'video/mp4',
        eTag: res.eTag
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Streams a movie from OCI Object Storage directly to an Express response with HTTP 206 Partial Content support.
   */
  async streamMovie(infoHash, req, res) {
    if (!this.isReady || !this.client) {
      return res.status(503).send('Object storage not configured');
    }

    const objectName = `movies/${infoHash}/video.mp4`;
    const meta = await this.getMovieMetadata(infoHash);
    if (!meta) {
      return res.status(404).send('Cached movie not found in OCI Object Storage');
    }

    const fileSize = meta.contentLength;
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunkSize = end - start + 1;
      const getRes = await this.client.getObject({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName,
        objectName,
        range: new common.Range(start, end)
      });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': meta.contentType,
        'Access-Control-Allow-Origin': '*'
      });

      getRes.value.pipe(res);
      req.on('close', () => {
        if (getRes.value.destroy) getRes.value.destroy();
      });
    } else {
      const getRes = await this.client.getObject({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName,
        objectName
      });

      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': meta.contentType,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*'
      });

      getRes.value.pipe(res);
      req.on('close', () => {
        if (getRes.value.destroy) getRes.value.destroy();
      });
    }
  }

  /**
   * Saves subtitle WebVTT string to OCI Object Storage.
   */
  async saveSubtitles(infoHash, subIndex, vttContent) {
    if (!this.isReady || !this.client) return;
    try {
      const objectName = `movies/${infoHash}/sub_${subIndex}.vtt`;
      const buf = Buffer.from(vttContent, 'utf-8');
      await this.client.putObject({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName,
        objectName,
        putObjectBody: buf,
        contentLength: buf.length,
        contentType: 'text/vtt; charset=utf-8'
      });
      console.log(`[OCI Object Storage] Saved subtitles track ${subIndex} for infoHash: ${infoHash}`);
    } catch (err) {
      console.error(`[OCI Object Storage] Failed to save subtitles: ${err.message}`);
    }
  }

  /**
   * Retrieves subtitle WebVTT string from OCI Object Storage.
   */
  async getSubtitles(infoHash, subIndex) {
    if (!this.isReady || !this.client) return null;
    try {
      const objectName = `movies/${infoHash}/sub_${subIndex}.vtt`;
      const res = await this.client.getObject({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName,
        objectName
      });
      const chunks = [];
      for await (const chunk of res.value) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString('utf-8');
    } catch (e) {
      return null;
    }
  }

  /**
   * Asynchronously saves a downloaded movie stream to OCI Object Storage in the background.
   */
  async saveMovieStream(infoHash, stream, contentLength, mimeType = 'video/mp4') {
    if (!this.isReady || !this.client) return;
    try {
      const objectName = `movies/${infoHash}/video.mp4`;
      console.log(`[OCI Object Storage] Uploading movie (${(contentLength / 1024 / 1024).toFixed(1)} MB) to OCI bucket...`);
      await this.client.putObject({
        namespaceName: this.namespaceName,
        bucketName: this.bucketName,
        objectName,
        putObjectBody: stream,
        contentLength,
        contentType: mimeType
      });
      console.log(`[OCI Object Storage] ✓ Movie cached successfully in bucket: ${objectName}`);
    } catch (err) {
      console.error(`[OCI Object Storage] Background upload failed: ${err.message}`);
    }
  }
}

export const ociStorage = new OciObjectStorageService();
export default ociStorage;
