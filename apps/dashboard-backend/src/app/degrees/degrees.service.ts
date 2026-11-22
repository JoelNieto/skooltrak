import { Injectable, NotFoundException } from '@nestjs/common';
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

  findAll(organizationId: string) {
    return this.prisma.degree.findMany({
      where: { school: { organizationId } },
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

  /** The degree's school, for the access check (404 when missing). */
  async ref(id: string) {
    const degree = await this.prisma.degree.findUnique({ where: { id }, select: { id: true, schoolId: true } });
    if (!degree) throw new NotFoundException('Grado no encontrado');
    return degree;
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
        ...(schoolId ? { school: { connect: { id: schoolId } } } : {}),
      },
    });
  }

  remove(id: string) {
    return this.prisma.degree.delete({ where: { id } });
  }
}
