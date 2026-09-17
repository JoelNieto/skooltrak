import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDegreeInput } from './dto/create-degree.input';
import { UpdateDegreeInput } from './dto/update-degree.input';

@Injectable()
export class DegreesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createDegreeInput: CreateDegreeInput) {
    return this.prisma.degree.create({
      data: createDegreeInput,
      include: { school: true, studyPlans: true },
    });
  }

  findAll() {
    return this.prisma.degree.findMany({
      include: { school: true, studyPlans: true },
    });
  }

  findManyBySchoolId(schoolId: string, options?: { take?: number; skip?: number }) {
    return this.prisma.degree.findMany({
      where: { schoolId },
      take: options?.take,
      skip: options?.skip,
      orderBy: { createdAt: 'asc' },
      include: { school: true },
    });
  }

  countBySchoolId(schoolId: string) {
    return this.prisma.degree.count({ where: { schoolId } });
  }

  findOne(id: string) {
    return this.prisma.degree.findUnique({
      where: { id },
      include: { school: true, studyPlans: true },
    });
  }

  update(id: string, updateDegreeInput: UpdateDegreeInput) {
    const { name, shortName, schoolId } = updateDegreeInput;
    return this.prisma.degree.update({
      where: { id },
      data: {
        name,
        shortName,
        school: { connect: { id: schoolId } },
      },
    });
  }

  remove(id: string) {
    return this.prisma.degree.delete({ where: { id } });
  }
}
