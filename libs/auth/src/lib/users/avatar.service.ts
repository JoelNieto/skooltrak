import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AvatarService {
  private readonly s3Client: S3Client | null;
  private readonly avatarsBucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const endpoint = this.config.get<string>('CLOUDFLARE_R2_ENDPOINT');
    const accessKeyId = this.config.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.avatarsBucket = this.config.get<string>('CLOUDFLARE_R2_BUCKET') || '';

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
    } else {
      this.s3Client = null;
    }
  }

  async createAvatarUploadUrl(userId: string, mimeType: string) {
    if (!this.s3Client) {
      throw new Error('Avatar storage is not configured.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    const extension = this.getExtensionFromMimeType(mimeType);
    const timestamp = Date.now();
    const storageKey = `avatars/${userId}/${timestamp}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.avatarsBucket,
      Key: storageKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 15 * 60,
    });

    return { uploadUrl, storageKey };
  }

  async createAvatarDownloadUrl(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    if (!user?.image) {
      return { downloadUrl: '' };
    }

    const downloadUrl = await this.getAvatarUrl(user.image);
    return { downloadUrl };
  }

  async getAvatarUrl(storageKey: string): Promise<string | null> {
    if (!storageKey || !this.s3Client) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.avatarsBucket,
        Key: storageKey,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60,
      });
    } catch (error) {
      console.error('Error generating avatar URL:', error);
      return null;
    }
  }

  updateAvatar(userId: string, image: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { image },
    });
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return mimeToExt[mimeType] || 'png';
  }
}
