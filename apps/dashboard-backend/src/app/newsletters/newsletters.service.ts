import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateNewsletterInput } from './dto/create-newsletter.input';
import { UpdateNewsletterInput } from './dto/update-newsletter.input';

@Injectable({ scope: Scope.REQUEST })
export class NewslettersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  private get includeRelations() {
    return { organization: true, school: true, author: true } as const;
  }

  async create(createNewsletterInput: CreateNewsletterInput) {
    const req = this.request;
    const { organizationId, userId } = req.user as any;

    return this.prisma.newsletter.create({
      data: {
        title: createNewsletterInput.title,
        content: createNewsletterInput.content,
        published: createNewsletterInput.published ?? false,
        publishedAt: createNewsletterInput.published ? new Date() : null,
        organization: { connect: { id: organizationId } },
        school: { connect: { id: createNewsletterInput.schoolId } },
        author: { connect: { id: userId } },
      },
      include: this.includeRelations,
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { skip, take, orderBy, orderDirection, search, schoolId } =
      fetchDataInput;
    const req = this.request;
    const { organizationId } = req.user as any;

    return this.prisma.newsletter.findMany({
      where: {
        organizationId,
        ...(schoolId ? { schoolId } : {}),
        ...(search
          ? { title: { contains: search, mode: 'insensitive' as const } }
          : {}),
      },
      skip,
      take,
      orderBy: {
        [orderBy ?? 'createdAt']: orderDirection ?? 'desc',
      },
      include: this.includeRelations,
    });
  }

  findCount(fetchDataInput: FetchDataInput) {
    const { search, schoolId } = fetchDataInput;
    const req = this.request;
    const { organizationId } = req.user as any;

    return this.prisma.newsletter.count({
      where: {
        organizationId,
        ...(schoolId ? { schoolId } : {}),
        ...(search
          ? { title: { contains: search, mode: 'insensitive' as const } }
          : {}),
      },
    });
  }

  findPublished(schoolId: string, take: number) {
    const req = this.request;
    const { organizationId } = req.user as any;

    return this.prisma.newsletter.findMany({
      where: {
        organizationId,
        schoolId,
        published: true,
      },
      take,
      orderBy: { publishedAt: 'desc' },
      include: this.includeRelations,
    });
  }

  findOne(id: string) {
    return this.prisma.newsletter.findUnique({
      where: { id },
      include: this.includeRelations,
    });
  }

  async update(id: string, updateNewsletterInput: UpdateNewsletterInput) {
    const existing = await this.prisma.newsletter.findUnique({
      where: { id },
    });

    // Set publishedAt when transitioning from draft to published
    const publishedAt =
      updateNewsletterInput.published && !existing?.published
        ? new Date()
        : existing?.publishedAt;

    const { id: _id, schoolId, ...rest } = updateNewsletterInput;

    return this.prisma.newsletter.update({
      where: { id },
      data: {
        ...rest,
        publishedAt,
        ...(schoolId ? { school: { connect: { id: schoolId } } } : {}),
      },
      include: this.includeRelations,
    });
  }

  remove(id: string) {
    return this.prisma.newsletter.delete({ where: { id } });
  }
}
