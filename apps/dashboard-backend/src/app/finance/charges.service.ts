import { AuthUserContext } from '@/auth';
import { ChargeSource, EnrollmentStatus } from '@generated/prisma';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccountsService } from './accounts.service';
import { CreateChargeInput, CreateChargeResult } from './dto/create-charge.input';

export const CHARGE_TARGET_REQUIRED = 'Indica un estudiante o un grupo, no ambos';
export const STUDENT_NOT_IN_SCHOOL = 'El estudiante no pertenece a esta escuela';
export const GROUP_NOT_IN_SCHOOL = 'El grupo no pertenece a esta escuela';
export const GROUP_EMPTY = 'El grupo no tiene estudiantes activos';
export const DUE_DATE_INVALID = 'La fecha de vencimiento no es válida';

@Injectable()
export class ChargesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
  ) {}

  /**
   * FR-FIN-001.7: a manual charge for one student, or one per active student of a class group,
   * each on the student's family account. The caller must already be a finance manager of the
   * school (finance.controller.ts).
   */
  async createManual(user: AuthUserContext | undefined, organizationId: string, input: CreateChargeInput): Promise<CreateChargeResult> {
    const { schoolId, studentId, classGroupId } = input;
    if (!studentId === !classGroupId) throw new BadRequestException(CHARGE_TARGET_REQUIRED);
    const dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);
    if (Number.isNaN(dueDate.getTime()) || dueDate.toISOString().slice(0, 10) !== input.dueDate) {
      throw new BadRequestException(DUE_DATE_INVALID);
    }
    const description = input.description.trim();
    if (!description) throw new BadRequestException('La descripción es obligatoria');
    const amount = Math.round(input.amount * 100) / 100;
    if (!(amount > 0)) throw new BadRequestException('El monto debe ser mayor que cero');

    let studentIds: string[];
    if (studentId) {
      const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { schoolId: true } });
      if (!student) throw new NotFoundException('Estudiante no encontrado');
      if (student.schoolId !== schoolId) throw new BadRequestException(STUDENT_NOT_IN_SCHOOL);
      studentIds = [studentId];
    } else {
      const group = await this.prisma.classGroup.findUnique({ where: { id: classGroupId }, select: { schoolId: true } });
      if (!group) throw new NotFoundException('Grupo no encontrado');
      if (group.schoolId !== schoolId) throw new BadRequestException(GROUP_NOT_IN_SCHOOL);
      const students = await this.prisma.student.findMany({
        where: { classGroupId, schoolId, enrollmentStatus: EnrollmentStatus.ACTIVE },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!students.length) throw new BadRequestException(GROUP_EMPTY);
      studentIds = students.map((s) => s.id);
    }

    await this.accounts.sync(schoolId);
    const links = await this.prisma.familyAccountStudent.findMany({
      where: { schoolId, studentId: { in: studentIds } },
      select: { studentId: true, accountId: true },
    });
    const accountOf = new Map(links.map((l) => [l.studentId, l.accountId]));

    const ids = await this.prisma.$transaction(async (tx) => {
      const created: string[] = [];
      for (const id of studentIds) {
        const accountId = accountOf.get(id);
        if (!accountId) throw new NotFoundException('El estudiante no tiene cuenta familiar');
        const charge = await tx.charge.create({
          data: {
            organizationId,
            schoolId,
            accountId,
            studentId: id,
            year: dueDate.getUTCFullYear(),
            source: ChargeSource.MANUAL,
            description,
            grossAmount: amount,
            netAmount: amount,
            dueDate,
            createdById: user?.userId ?? null,
          },
          select: { id: true },
        });
        created.push(charge.id);
      }
      await tx.financeAuditLog.create({
        data: {
          organizationId,
          schoolId,
          actorId: user?.userId ?? null,
          action: 'CHARGE_CREATE_MANUAL',
          entity: classGroupId ? 'ClassGroup' : 'Student',
          entityId: (classGroupId ?? studentId)!,
          payload: { description, amount, dueDate: input.dueDate, chargeIds: created },
        },
      });
      return created;
    });
    return { created: ids.length, chargeIds: ids };
  }
}
