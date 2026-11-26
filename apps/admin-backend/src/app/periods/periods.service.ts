import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePeriodInput } from './dto/create-period.input';
import { UpdatePeriodInput } from './dto/update-period.input';

@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPeriodInput: CreatePeriodInput) {
    return this.prisma.period.create({
      data: { ...createPeriodInput, schoolId: null },
    });
  }

  /** The global periods, newest year first; within a year, by start date. */
  findAll() {
    return this.prisma.period.findMany({
      where: { schoolId: null },
      orderBy: [{ year: 'desc' }, { startDate: 'asc' }],
    });
  }

  /** Per year: the schools that use their own periods instead of the global ones. */
  async customSchools(): Promise<{ year: number; schools: { id: string; name: string }[] }[]> {
    const rows = await this.prisma.period.findMany({
      where: { schoolId: { not: null } },
      select: { year: true, school: { select: { id: true, name: true } } },
      distinct: ['year', 'schoolId'],
      orderBy: [{ year: 'desc' }],
    });
    const byYear = new Map<number, { id: string; name: string }[]>();
    for (const row of rows) {
      if (row.school) byYear.set(row.year, [...(byYear.get(row.year) ?? []), row.school]);
    }
    return [...byYear.entries()].map(([year, schools]) => ({
      year,
      schools: schools.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }

  findOne(id: string) {
    return this.prisma.period.findUnique({
      where: { id },
    });
  }

  update(id: string, updatePeriodInput: UpdatePeriodInput) {
    return this.prisma.period.update({
      where: { id },
      data: updatePeriodInput,
    });
  }

  remove(id: string) {
    return this.prisma.period.delete({ where: { id } });
  }
}
