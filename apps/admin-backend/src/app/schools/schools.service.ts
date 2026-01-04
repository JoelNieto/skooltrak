import { Injectable } from '@nestjs/common';
import { FetchDataInput } from '../fetch-data.input';
import { PrismaService } from '../prisma.service';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createSchoolInput: CreateSchoolInput) {
    return this.prisma.school.create({
      data: createSchoolInput,
      include: {
        organization: true,
      },
    });
  }

  findAll(fetchDataInput: FetchDataInput) {
    const { organizationId, search, skip, take } = fetchDataInput;
    if (organizationId) {
      return this.prisma.school.findMany({
        include: {
          organization: true,
        },
        where: {
          organizationId,
        },
      });
    }
    return this.prisma.school.findMany({
      include: {
        organization: true,
      },
      skip,
      take,
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      },
    });
  }

  count(fetchDataInput: FetchDataInput) {
    const { search } = fetchDataInput;
    return this.prisma.school.count({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { shortName: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      },
    });
  }

  findOne(id: string) {
    return this.prisma.school.findUnique({
      include: {
        organization: true,
      },
      where: { id },
    });
  }

  update(id: string, updateSchoolInput: UpdateSchoolInput) {
    return this.prisma.school.update({
      where: { id },
      data: updateSchoolInput,
      include: {
        organization: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.school.delete({ where: { id } });
  }
}
