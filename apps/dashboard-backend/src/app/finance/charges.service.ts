import { AuthUserContext } from '@/auth';
import { ChargeSource, EnrollmentStatus } from '@generated/prisma';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccountsService } from './accounts.service';
import { CreateChargeInput, CreateChargeResult } from './dto/create-charge.input';
import { FinanceStudentHit } from './entities/finance.entity';

export const CHARGE_TARGET_REQUIRED = 'Indica un estudiante o un grupo, no ambos';
export const STUDENT_NOT_IN_SCHOOL = 'El estudiante no pertenece a esta escuela';
export const GROUP_NOT_IN_SCHOOL = 'El grupo no pertenece a esta escuela';
export const GROUP_EMPTY = 'El grupo no tiene estudiantes activos';
export const DUE_DATE_INVALID = 'La fecha de vencimiento no es válida';
export const CANCEL_REASON_REQUIRED = 'Indica el motivo de la cancelación';
export const CHARGE_ALREADY_CANCELLED = 'El cargo ya está cancelado';
export const CHARGE_HAS_PAYMENTS = 'El cargo tiene pagos aplicados; anule el pago primero';

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

  /**
   * Active students of the school whose names or cédula match every word of `q`, for the charge
   * and generation pickers. The caller must be a finance manager of the school.
   */
  async searchStudents(schoolId: string, q: string, take = 10): Promise<FinanceStudentHit[]> {
    const words = q.trim().split(/\s+/).filter((w) => w.length > 0).slice(0, 5);
    if (!words.length) return [];
    const rows = await this.prisma.student.findMany({
      where: {
        schoolId,
        enrollmentStatus: EnrollmentStatus.ACTIVE,
        AND: words.map((w) => ({
          OR: [
            { firstName: { contains: w, mode: 'insensitive' as const } },
            { middleName: { contains: w, mode: 'insensitive' as const } },
            { fatherName: { contains: w, mode: 'insensitive' as const } },
            { motherName: { contains: w, mode: 'insensitive' as const } },
            { documentId: { contains: w, mode: 'insensitive' as const } },
          ],
        })),
      },
      orderBy: [{ fatherName: 'asc' }, { firstName: 'asc' }],
      take: Math.min(Math.max(1, take), 25),
      select: { id: true, firstName: true, fatherName: true, classGroup: { select: { id: true, name: true } } },
    });
    return rows.map((s) => ({ id: s.id, name: `${s.firstName} ${s.fatherName}`.trim(), classGroup: s.classGroup }));
  }

  /** The charge's school, for the controller's access check (404 when it doesn't exist). */
  async chargeSchool(chargeId: string): Promise<string> {
    const charge = await this.prisma.charge.findUnique({ where: { id: chargeId }, select: { schoolId: true } });
    if (!charge) throw new NotFoundException('Cargo no encontrado');
    return charge.schoolId;
  }

  /**
   * FR-FIN-001.8: cancels a charge with a reason. Refused while a payment is applied to it
   * (BR-FIN-001.6): the payment has to be voided first. The charge row is locked so a payment can't
   * land on it meanwhile. It stays listed, struck through, and owes nothing. The caller must be a
   * finance manager of the charge's school.
   */
  async cancel(
    user: AuthUserContext | undefined,
    organizationId: string,
    chargeId: string,
    reasonInput: string,
  ): Promise<{ id: string; cancelledAt: string; cancelReason: string }> {
    const reason = (reasonInput ?? '').trim();
    if (!reason) throw new BadRequestException(CANCEL_REASON_REQUIRED);
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "charges" WHERE "id" = ${chargeId} FOR UPDATE`;
      const charge = await tx.charge.findUnique({
        where: { id: chargeId },
        select: {
          organizationId: true,
          schoolId: true,
          description: true,
          cancelledAt: true,
          _count: { select: { allocations: { where: { reversedAt: null } } } },
        },
      });
      if (!charge || charge.organizationId !== organizationId) throw new NotFoundException('Cargo no encontrado');
      if (charge.cancelledAt) throw new ConflictException(CHARGE_ALREADY_CANCELLED);
      if (charge._count.allocations > 0) throw new ConflictException(CHARGE_HAS_PAYMENTS);
      const updated = await tx.charge.update({
        where: { id: chargeId },
        data: { cancelledAt: new Date(), cancelledById: user?.userId ?? null, cancelReason: reason },
        select: { id: true, cancelledAt: true, cancelReason: true },
      });
      await tx.financeAuditLog.create({
        data: {
          organizationId,
          schoolId: charge.schoolId,
          actorId: user?.userId ?? null,
          action: 'CHARGE_CANCEL',
          entity: 'Charge',
          entityId: chargeId,
          payload: { reason, description: charge.description },
        },
      });
      return { id: updated.id, cancelledAt: updated.cancelledAt!.toISOString(), cancelReason: updated.cancelReason! };
    });
  }
}
