import { Prisma } from '@generated/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { settingsScalars } from '../study-plans/plan-settings-writes';
import { CreateDegreeInput } from './dto/create-degree.input';
import { UpdateDegreeInput } from './dto/update-degree.input';

/** A degree with the settings its study plans inherit. */
const DEGREE_SETTINGS_INCLUDE = {
  gradeMetric: true,
} as const satisfies Prisma.DegreeInclude;

@Injectable()
export class DegreesService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateDegreeInput) {
    return this.prisma.degree.create({
      data: {
        name: input.name,
        shortName: input.shortName,
        schoolId: input.schoolId,
        ...settingsScalars(input),
      },
      include: { school: true, studyPlans: true, ...DEGREE_SETTINGS_INCLUDE },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.degree.findMany({
      where: { school: { organizationId } },
      include: { school: true, studyPlans: true, ...DEGREE_SETTINGS_INCLUDE },
    });
  }

  findManyBySchoolId(schoolId: string, options?: { take?: number; skip?: number }) {
    return this.prisma.degree.findMany({
      where: { schoolId },
      take: options?.take,
      skip: options?.skip,
      orderBy: { createdAt: 'asc' },
      include: {
        school: true,
        ...DEGREE_SETTINGS_INCLUDE,
        // The highest grade, for the next plan's suggested level.
        studyPlans: { select: { level: true }, orderBy: { level: 'desc' }, take: 1 },
        _count: { select: { studyPlans: true } },
      },
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
      include: { school: true, studyPlans: true, ...DEGREE_SETTINGS_INCLUDE },
    });
  }

  /** Updates the degree and the grade metric its plans inherit. */
  update(id: string, input: UpdateDegreeInput) {
    const { name, shortName, schoolId } = input;
    return this.prisma.degree.update({
      where: { id },
      data: {
        name,
        shortName,
        ...(schoolId ? { schoolId } : {}),
        ...settingsScalars(input),
      },
      include: DEGREE_SETTINGS_INCLUDE,
    });
  }

  remove(id: string) {
    return this.prisma.degree.delete({ where: { id } });
  }
}
