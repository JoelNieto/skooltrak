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
      classGroupId,
      amount,
      dueDate,
      description = '',
      chargeType = $Enums.ChargeType.CUSTOM,
    } = input;

    if (!studentId && !classGroupId) {
      throw new BadRequestException('Either studentId or classGroupId is required');
    }
    if (studentId && classGroupId) {
      throw new BadRequestException('Provide only one of studentId or classGroupId');
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
        include: { school: true, student: true, classGroup: true },
      });
      return [charge];
    }

    const group = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId! },
      include: { students: true },
    });
    if (!group) {
      throw new BadRequestException('Class group not found');
    }
    if (group.students.length === 0) {
      throw new BadRequestException('Class group has no students');
    }

    const charges = await this.prisma.$transaction(
      group.students.map((s) =>
        this.prisma.charge.create({
          data: {
            schoolId,
            year,
            studentId: s.id,
            classGroupId: group.id,
            amount,
            dueDate,
            description,
            chargeType,
            status: $Enums.ChargeStatus.PENDING,
          },
          include: { school: true, student: true, classGroup: true },
        })
      )
    );
    return charges;
  }

  async findByStudent(studentId: string) {
    return this.prisma.charge.findMany({
      where: { studentId },
      include: { school: true, classGroup: true },
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
      include: { student: true, classGroup: true },
      orderBy: [{ year: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async remove(id: string) {
    return this.prisma.charge.delete({
      where: { id },
      include: { school: true, student: true, classGroup: true },
    });
  }
}
