import { FetchDataQueryDto, PaginatedResponseDto } from '@/api-contracts';
import type { AuthUserContext } from '@/auth';
import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';

export const SUBJECT_DENIED = 'No tienes acceso a esta asignatura';

/** Every subject read and write is limited to the caller's organization. */
@Injectable({ scope: Scope.REQUEST })
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /** The caller's organization; refuses callers without one. */
  private organizationId(): string {
    const user = this.request.user as AuthUserContext | undefined;
    if (!user?.organizationId) throw new ForbiddenException(SUBJECT_DENIED);
    return user.organizationId;
  }

  /** Throws 403 unless the subject exists in the caller's organization. */
  private async assertInOrganization(id: string): Promise<void> {
    const subject = await this.prisma.subject.findFirst({
      where: { id, organizationId: this.organizationId() },
      select: { id: true },
    });
    if (!subject) throw new ForbiddenException(SUBJECT_DENIED);
  }

  /**
   * Generates a unique subject code starting with 3 letters.
   * If the code already exists, it adds more letters until unique.
   */
  private async generateUniqueCode(organizationId: string, baseName: string): Promise<string> {
    // Remove non-alphabetic characters and convert to uppercase
    const cleanName = baseName.replace(/[^a-zA-Z]/g, '').toUpperCase();

    // Start with 3 letters minimum
    for (let length = 3; length <= cleanName.length; length++) {
      const code = cleanName.substring(0, length);

      const existing = await this.prisma.subject.findFirst({
        where: { organizationId, code },
      });

      if (!existing) {
        return code;
      }
    }

    // If all substrings are taken, append a number
    let counter = 1;
    while (true) {
      const code = `${cleanName.substring(0, 3)}${counter}`;
      const existing = await this.prisma.subject.findFirst({
        where: { organizationId, code },
      });

      if (!existing) {
        return code;
      }
      counter++;
    }
  }

  async create(createSubjectInput: CreateSubjectInput) {
    const organizationId = this.organizationId();

    // Use provided code or generate a unique one from subject name
    const code = createSubjectInput.code
      ? createSubjectInput.code
      : await this.generateUniqueCode(organizationId, createSubjectInput.name);

    return this.prisma.subject.create({
      data: {
        name: createSubjectInput.name,
        code,
        icon: createSubjectInput.icon ?? null,
        organizationId,
      },
      include: { organization: true },
    });
  }

  async findAll(fetchDataInput: FetchDataQueryDto) {
    const { skip, page, pageSize, orderBy, orderDirection, search } = fetchDataInput;
    const organizationId = this.organizationId();
    const [data, count] = await this.prisma.$transaction([
      this.prisma.subject.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        },
        skip,
        take: pageSize,
        orderBy: {
          [orderBy ?? 'name']: orderDirection,
        },
      }),
      this.prisma.subject.count({
        where: {
          organizationId,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    ]);
    return new PaginatedResponseDto(data, count, page, pageSize);
  }

  findCount(fetchDataInput: FetchDataQueryDto) {
    const { search } = fetchDataInput;
    const organizationId = this.organizationId();
    return this.prisma.subject.count({
      where: {
        organizationId,
        OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }],
      },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, organizationId: this.organizationId() },
    });
    if (!subject) throw new ForbiddenException(SUBJECT_DENIED);
    return subject;
  }

  async update(id: string, updateSubjectInput: UpdateSubjectInput) {
    await this.assertInOrganization(id);
    // Only the editable fields; a subject never moves to another organization.
    const { name, code, icon } = updateSubjectInput;
    return this.prisma.subject.update({
      where: { id },
      data: { name, code, icon },
    });
  }

  async remove(id: string) {
    await this.assertInOrganization(id);
    return this.prisma.subject.delete({ where: { id } });
  }
}
