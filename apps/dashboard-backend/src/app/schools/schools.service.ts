import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { CreateSchoolInput } from './dto/create-school.input';
import { SchoolLogoUploadInput } from './dto/school-logo-upload.input';
import { UpdateSchoolInput } from './dto/update-school.input';

@Injectable({ scope: Scope.REQUEST })
export class SchoolsService {
  private readonly s3Client: S3Client;
  private readonly r2Bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(CONTEXT) private readonly context: { req: Request },
  ) {
    const endpoint = this.config.get<string>('CLOUDFLARE_R2_ENDPOINT');
    const accessKeyId = this.config.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.r2Bucket = this.config.get<string>('CLOUDFLARE_R2_BUCKET') || '';

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
    }
  }

  private async ensureUniqueSlug(base: string, excludeSchoolId?: string): Promise<string> {
    const normalized =
      base
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'school';
    let candidate = normalized;
    let n = 0;
    while (true) {
      const existing = await this.prisma.school.findFirst({
        where: {
          slug: candidate,
          ...(excludeSchoolId ? { NOT: { id: excludeSchoolId } } : {}),
        },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
      n += 1;
      candidate = `${normalized}-${n}`;
    }
  }

  async create(createSchoolInput: CreateSchoolInput) {
    const { req } = this.context;
    const { organizationId } = req.user as { organizationId: string };
    const { slug: inputSlug, ...rest } = createSchoolInput;
    const slug =
      inputSlug?.trim() || (await this.ensureUniqueSlug(createSchoolInput.shortName || createSchoolInput.name));

    return this.prisma.school.create({
      data: {
        ...rest,
        organizationId,
        slug,
      },
    });
  }

  findAll() {
    const { req } = this.context;
    const { organizationId } = req.user as { organizationId: string };
    return this.prisma.school.findMany({ where: { organizationId } });
  }

  findOne(id: string) {
    return this.prisma.school.findUnique({ where: { id } });
  }

  async update(id: string, updateSchoolInput: UpdateSchoolInput) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, slug, ...data } = updateSchoolInput;
    const nextData = { ...data } as Record<string, unknown>;
    if (slug !== undefined && slug !== null) {
      const trimmed = slug.trim();
      nextData.slug = trimmed ? await this.ensureUniqueSlug(trimmed, id) : null;
    }
    return this.prisma.school.update({
      where: { id },
      data: nextData,
    });
  }

  remove(id: string) {
    return this.prisma.school.delete({ where: { id } });
  }

  async createLogoUploadUrl(input: SchoolLogoUploadInput) {
    const { req } = this.context;
    const { organizationId } = req.user as { organizationId: string };

    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    // Verify school belongs to organization
    const school = await this.prisma.school.findFirst({
      where: { id: input.schoolId, organizationId },
      select: { id: true },
    });

    if (!school) {
      throw new ForbiddenException('School not found in organization.');
    }

    // Determine file extension from mime type
    const extension = this.getExtensionFromMimeType(input.mimeType);
    const timestamp = Date.now();
    const storageKey = `schools/${input.schoolId}/logo-${timestamp}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: storageKey,
      ContentType: input.mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 15 * 60, // 15 minutes
    });

    return { uploadUrl, storageKey };
  }

  async createLogoDownloadUrl(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { logo: true },
    });

    if (!school?.logo) {
      return { downloadUrl: '' };
    }

    const command = new GetObjectCommand({
      Bucket: this.r2Bucket,
      Key: school.logo,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 60 * 60, // 1 hour
    });

    return { downloadUrl };
  }

  updateLogo(id: string, logo: string) {
    return this.prisma.school.update({
      where: { id },
      data: { logo },
    });
  }

  async getLogoUrl(storageKey: string): Promise<string | null> {
    if (!storageKey || !this.s3Client) {
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.r2Bucket,
        Key: storageKey,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60, // 1 hour
      });

      return downloadUrl;
    } catch (error) {
      console.error('Error generating logo URL:', error);
      return null;
    }
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
