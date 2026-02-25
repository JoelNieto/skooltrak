import { $Enums } from '@generated/prisma';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateChargeInput } from './dto/create-charge.input';

@Injectable()
export class ChargesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateChargeInput) {
    const {
      schoolId,
      year,
      studentId,
      studyPlanId,
      amount,
      dueDate,
      description = '',
      chargeType = $Enums.ChargeType.CUSTOM,
    } = input;

    if (!studentId && !studyPlanId) {
      throw new BadRequestException('Either studentId or studyPlanId is required');
    }
    if (studentId && studyPlanId) {
      throw new BadRequestException('Provide only one of studentId or studyPlanId');
    }

    if (studentId) {
      const charge = await this.prisma.charge.create({
        data: {
          schoolId,
          year,
          studentId,
          amount,
          dueDate,
          description,
          chargeType,
          status: $Enums.ChargeStatus.PENDING,
        },
        include: { school: true, student: true, studyPlan: true },
      });
      return [charge];
    }

    const studyPlan = await this.prisma.studyPlan.findUnique({
      where: { id: studyPlanId! },
      include: { classGroups: { include: { students: true } } },
    });
    if (!studyPlan) {
      throw new BadRequestException('Study plan not found');
    }
    const students = studyPlan.classGroups.flatMap((cg) => cg.students);
    const uniqueStudents = [...new Map(students.map((s) => [s.id, s])).values()];
    if (uniqueStudents.length === 0) {
      throw new BadRequestException('Study plan has no students in any class group');
    }

    const charges = await this.prisma.$transaction(
      uniqueStudents.map((s) =>
        this.prisma.charge.create({
          data: {
            schoolId,
            year,
            studentId: s.id,
            studyPlanId: studyPlan.id,
            amount,
            dueDate,
            description,
            chargeType,
            status: $Enums.ChargeStatus.PENDING,
          },
          include: { school: true, student: true, studyPlan: true },
        })
      )
    );
    return charges;
  }

  async findByStudent(studentId: string) {
    return this.prisma.charge.findMany({
      where: { studentId },
      include: { school: true, studyPlan: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findBySchool(schoolId: string, year?: number) {
    const where: { schoolId: string; year?: number } = { schoolId };
    if (year != null) {
      where.year = year;
    }
    return this.prisma.charge.findMany({
      where,
      include: { student: true, studyPlan: true },
      orderBy: [{ year: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async remove(id: string) {
    return this.prisma.charge.delete({
      where: { id },
      include: { school: true, student: true, studyPlan: true },
    });
  }
}
