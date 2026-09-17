import { FetchDataQueryDto, PaginatedResponseDto } from '@/api-contracts';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
@Injectable({ scope: Scope.REQUEST })
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

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
    const req = this.request;
    const { organizationId } = req.user as any;

    // Use provided code or generate a unique one from subject name
    const code = createSubjectInput.code
      ? createSubjectInput.code
      : await this.generateUniqueCode(organizationId, createSubjectInput.name);

    return this.prisma.subject.create({
      data: {
        ...createSubjectInput,
        code,
        organizationId,
      },
      include: { organization: true },
    });
  }

  async findAll(fetchDataInput: FetchDataQueryDto) {
    const { skip, page, pageSize, orderBy, orderDirection, search } = fetchDataInput;
    const req = this.request;
    const { organizationId } = req.user as any;
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
    const req = this.request;
    const { organizationId } = req.user as any;
    return this.prisma.subject.count({
      where: {
        organizationId,
        OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }],
      },
    });
  }

  findOne(id: string) {
    return this.prisma.subject.findUnique({
      where: { id },
    });
  }

  update(id: string, updateSubjectInput: UpdateSubjectInput) {
    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectInput,
    });
  }

  remove(id: string) {
    return this.prisma.subject.delete({ where: { id } });
  }
}
