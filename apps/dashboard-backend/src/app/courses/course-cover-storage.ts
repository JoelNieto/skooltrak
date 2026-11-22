import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const STORAGE_UNAVAILABLE = 'El almacenamiento de archivos no está configurado';
const URL_TTL_SECONDS = 3600;

/**
 * Course cover photos in the private object store (ACA-001 BR .12), like files and logos: Cloudflare
 * R2 through the S3 API, served by presigned URL. Without storage settings (local or CI), uploads
 * answer 503 and covers have no URL, so courses keep their color cover.
 */
@Injectable()
export class CourseCoverStorage {
  #client: S3Client | null = null;
  readonly #bucket: string | undefined;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('CLOUDFLARE_R2_ENDPOINT');
    const accessKeyId = config.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.#bucket = config.get<string>('CLOUDFLARE_R2_BUCKET');
    if (endpoint && accessKeyId && secretAccessKey && this.#bucket) {
      this.#client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    if (!this.#client) throw new ServiceUnavailableException(STORAGE_UNAVAILABLE);
    await this.#client.send(new PutObjectCommand({ Bucket: this.#bucket, Key: key, Body: body, ContentType: contentType }));
  }

  /** Best effort: a leftover object costs storage, never correctness. */
  async remove(key: string): Promise<void> {
    if (!this.#client) return;
    try {
      await this.#client.send(new DeleteObjectCommand({ Bucket: this.#bucket, Key: key }));
    } catch (error) {
      console.error(`[CourseCoverStorage] could not delete ${key}`, error);
    }
  }

  /** A presigned URL for the cover, or null without one or without storage. */
  async url(key: string | null | undefined): Promise<string | null> {
    if (!key || !this.#client) return null;
    return getSignedUrl(this.#client, new GetObjectCommand({ Bucket: this.#bucket, Key: key }), { expiresIn: URL_TTL_SECONDS });
  }
}
