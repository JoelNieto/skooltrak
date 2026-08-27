import { $Enums, Prisma } from '@generated/prisma';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateChargeInput } from './dto/create-charge.input';

type ChargeWithRelations = Prisma.ChargeGetPayload<{ include: { student: true; studyPlan: true } }>;

const MONTH_LABELS: Record<number, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

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

  async findBySchool(opts: {
    schoolId: string;
    year?: number;
    status?: string;
    chargeType?: string;
    studentId?: string;
    description?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: ChargeWithRelations[]; total: number }> {
    const where: Prisma.ChargeWhereInput = { schoolId: opts.schoolId };
    if (opts.year != null) {
      where.year = opts.year;
    }
    if (opts.status) {
      where.status = opts.status as $Enums.ChargeStatus;
    }
    if (opts.chargeType) {
      where.chargeType = opts.chargeType as $Enums.ChargeType;
    }
    if (opts.studentId) {
      where.studentId = opts.studentId;
    }
    if (opts.description) {
      where.description = { contains: opts.description, mode: 'insensitive' };
    }
    return this.findPaginated(where, opts.skip, opts.take);
  }

  /**
   * Same filtering/pagination as `findBySchool`, but scoped to a single student.
   * The student id is always resolved server-side (never trusted from the
   * client), so this is safe to expose on a student-only endpoint.
   */
  async findByStudentScoped(
    studentId: string,
    opts: {
      year?: number;
      status?: string;
      chargeType?: string;
      description?: string;
      skip?: number;
      take?: number;
    },
  ): Promise<{ data: ChargeWithRelations[]; total: number }> {
    const where: Prisma.ChargeWhereInput = { studentId };
    if (opts.year != null) {
      where.year = opts.year;
    }
    if (opts.status) {
      where.status = opts.status as $Enums.ChargeStatus;
    }
    if (opts.chargeType) {
      where.chargeType = opts.chargeType as $Enums.ChargeType;
    }
    if (opts.description) {
      where.description = { contains: opts.description, mode: 'insensitive' };
    }
    return this.findPaginated(where, opts.skip, opts.take);
  }

  private async findPaginated(
    where: Prisma.ChargeWhereInput,
    skip?: number,
    take?: number,
  ): Promise<{ data: ChargeWithRelations[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.charge.findMany({
        where,
        include: { student: true, studyPlan: true },
        orderBy: [{ year: 'desc' }, { dueDate: 'asc' }],
        skip,
        take,
      }),
      this.prisma.charge.count({ where }),
    ]);
    return { data, total };
  }

  async remove(id: string) {
    return this.prisma.charge.delete({
      where: { id },
      include: { school: true, student: true, studyPlan: true },
    });
  }

  /**
   * Idempotently creates the enrollment-cost and monthly-tuition charges for a
   * student based on their study plan. Skips silently if charges already exist
   * for this student + study plan (safe to call on create and on class-group
   * reassignment).
   */
  async generateFromStudyPlan(
    studentId: string,
    studyPlanId: string,
    schoolId: string,
    year: number,
  ) {
    const existing = await this.prisma.charge.count({
      where: { studentId, studyPlanId },
    });
    if (existing > 0) return 0;

    const studyPlan = await this.prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: { enrollmentCosts: { orderBy: { order: 'asc' } } },
    });
    if (!studyPlan) return 0;

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { currentYear: true, schoolYearStartMonth: true },
    });
    const startMonth = school?.schoolYearStartMonth ?? 8;
    const baseYear = school?.currentYear ?? year;

    const data: Prisma.ChargeCreateManyInput[] = [];

    // Enrollment costs are due at the start of the academic year.
    const enrollmentDue = new Date(baseYear, startMonth - 1, 1);
    for (const cost of studyPlan.enrollmentCosts) {
      data.push({
        schoolId,
        year: baseYear,
        studentId,
        studyPlanId,
        amount: cost.amount,
        dueDate: enrollmentDue,
        description: cost.name,
        chargeType: $Enums.ChargeType.ENROLLMENT,
        status: $Enums.ChargeStatus.PENDING,
      });
    }

    // One tuition charge per configured month.
    const tuitionAmount = studyPlan.monthlyTuitionAmount;
    const tuitionMonths = studyPlan.tuitionMonths ?? [];
    if (tuitionAmount && tuitionAmount.gt(0) && tuitionMonths.length > 0) {
      for (const m of tuitionMonths) {
        const y = m >= startMonth ? baseYear : baseYear + 1;
        data.push({
          schoolId,
          year: y,
          studentId,
          studyPlanId,
          amount: tuitionAmount,
          dueDate: new Date(y, m - 1, 1),
          description: `Colegiatura ${MONTH_LABELS[m] ?? m}`,
          chargeType: $Enums.ChargeType.TUITION,
          status: $Enums.ChargeStatus.PENDING,
        });
      }
    }

    if (data.length === 0) return 0;

    await this.prisma.charge.createMany({ data });
    return data.length;
  }

  /**
   * Backfills (or, with `force`, recreates) the study-plan charges for a
   * student that was created before automatic generation existed. Returns the
   * number of charges created.
   */
  async regenerateFromStudyPlan(studentId: string, force = false): Promise<{ created: number }> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classGroup: { select: { studyPlanId: true } },
        school: { select: { id: true, currentYear: true, schoolYearStartMonth: true } },
      },
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    const studyPlanId = student.classGroup?.studyPlanId;
    if (!studyPlanId) {
      throw new BadRequestException('El estudiante no tiene un plan de estudios asignado');
    }
    const schoolId = student.schoolId;
    const year = student.school?.currentYear ?? new Date().getFullYear();

    if (force) {
      await this.prisma.charge.deleteMany({
        where: { studentId, studyPlanId, status: { not: $Enums.ChargeStatus.PAID } },
      });
    }

    const created = await this.generateFromStudyPlan(studentId, studyPlanId, schoolId, year);
    return { created };
  }
}
