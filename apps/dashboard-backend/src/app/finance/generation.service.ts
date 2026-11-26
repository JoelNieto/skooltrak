import { AuthUserContext } from '@/auth';
import { ChargeSource, EnrollmentStatus, Prisma } from '@generated/prisma';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AccountsService } from './accounts.service';
import { cents, fromCents } from './charge-status';
import { GROUP_NOT_IN_SCHOOL, STUDENT_NOT_IN_SCHOOL } from './charges.service';
import { GenerateChargesInput } from './dto/fees.input';
import { GenerationItemLine, GenerationPreview, GenerationResult, GenerationStudentLine } from './entities/fees.entity';
import { feesForPlan } from './fee-plan';
import { installmentDescription, installments } from './fee-schedule';

export const GENERATION_SCOPE_REQUIRED = 'Indica un plan de estudio, un grupo o un estudiante';
export const PLAN_NOT_IN_SCHOOL = 'El plan de estudio no pertenece a esta escuela';
export const STUDENT_NOT_ACTIVE = 'El estudiante no está activo';
export const STUDENT_WITHOUT_GROUP = 'El estudiante no tiene grupo asignado';

/** One charge the generation would create, or found already created. */
interface PlannedCharge {
  studentId: string;
  feeItemId: string;
  installment: number;
  description: string;
  /** Cents. */
  amount: number;
  dueDate: string;
  exists: boolean;
}

interface ScopeStudent {
  id: string;
  name: string;
  classGroup: string | null;
  studyPlanId: string;
  degreeId: string;
}

/**
 * Charge generation from the fee catalog (FR-FIN-001.6). Idempotent: a charge is unique per
 * (student, fee item, year, installment) and re-running only creates what is missing; existing
 * charges are never changed (BR-FIN-001.5). The caller must be a finance manager of the school.
 */
@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
  ) {}

  async preview(input: GenerateChargesInput): Promise<GenerationPreview> {
    const { students, planned, currencyCode } = await this.plan(input);
    const fresh = planned.filter((p) => !p.exists);

    const itemIds = [...new Set(planned.map((p) => p.feeItemId))];
    const itemNames = await this.prisma.feeItem.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true } });

    const items: GenerationItemLine[] = itemNames
      .map((item) => {
        const rows = planned.filter((p) => p.feeItemId === item.id);
        const studentsOf = new Set(rows.map((r) => r.studentId));
        const newRows = rows.filter((r) => !r.exists);
        return {
          feeItemId: item.id,
          name: item.name,
          installments: studentsOf.size ? Math.round(rows.length / studentsOf.size) : 0,
          students: studentsOf.size,
          newCount: newRows.length,
          newTotal: fromCents(newRows.reduce((sum, r) => sum + r.amount, 0)),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    const studentLines: GenerationStudentLine[] = students.map((s) => {
      const rows = planned.filter((p) => p.studentId === s.id);
      const newRows = rows.filter((r) => !r.exists);
      return {
        id: s.id,
        name: s.name,
        classGroup: s.classGroup,
        newCount: newRows.length,
        newTotal: fromCents(newRows.reduce((sum, r) => sum + r.amount, 0)),
        existingCount: rows.length - newRows.length,
      };
    });

    return {
      year: input.year,
      students: students.length,
      newCount: fresh.length,
      newTotal: fromCents(fresh.reduce((sum, r) => sum + r.amount, 0)),
      existingCount: planned.length - fresh.length,
      items,
      studentLines,
      currencyCode,
    };
  }

  async generate(user: AuthUserContext | undefined, organizationId: string, input: GenerateChargesInput): Promise<GenerationResult> {
    const { planned } = await this.plan(input);
    const fresh = planned.filter((p) => !p.exists);
    if (!fresh.length) return { created: 0, skipped: planned.length };

    await this.accounts.sync(input.schoolId);
    const links = await this.prisma.familyAccountStudent.findMany({
      where: { schoolId: input.schoolId, studentId: { in: [...new Set(fresh.map((p) => p.studentId))] } },
      select: { studentId: true, accountId: true },
    });
    const accountOf = new Map(links.map((l) => [l.studentId, l.accountId]));

    const rows: Prisma.ChargeCreateManyInput[] = [];
    for (const p of fresh) {
      const accountId = accountOf.get(p.studentId);
      if (!accountId) {
        // Sync gives every student of the school an account; a student deleted meanwhile has none.
        this.logger.warn(`Student ${p.studentId} has no family account; charge skipped`);
        continue;
      }
      rows.push({
        organizationId,
        schoolId: input.schoolId,
        accountId,
        studentId: p.studentId,
        year: input.year,
        source: ChargeSource.FEE,
        feeItemId: p.feeItemId,
        installment: p.installment,
        description: p.description,
        grossAmount: fromCents(p.amount),
        netAmount: fromCents(p.amount),
        dueDate: new Date(`${p.dueDate}T00:00:00.000Z`),
        createdById: user?.userId ?? null,
      });
    }

    const created = await this.prisma.$transaction(async (tx) => {
      // skipDuplicates + the unique (student, item, year, installment) index: a concurrent run
      // can't create a charge twice (BR-FIN-001.5).
      const { count } = await tx.charge.createMany({ data: rows, skipDuplicates: true });
      await tx.financeAuditLog.create({
        data: {
          organizationId,
          schoolId: input.schoolId,
          actorId: user?.userId ?? null,
          action: 'CHARGE_GENERATE',
          entity: input.studentId ? 'Student' : input.classGroupId ? 'ClassGroup' : 'StudyPlan',
          entityId: (input.studentId ?? input.classGroupId ?? input.studyPlanId)!,
          payload: { year: input.year, created: count, planned: planned.length },
        },
      });
      return count;
    });
    return { created, skipped: planned.length - created };
  }

  /** Students of the scope and every charge the year's assignments give them. */
  private async plan(input: GenerateChargesInput): Promise<{ students: ScopeStudent[]; planned: PlannedCharge[]; currencyCode: string }> {
    const scopes = [input.studyPlanId, input.classGroupId, input.studentId].filter(Boolean);
    if (scopes.length !== 1) throw new BadRequestException(GENERATION_SCOPE_REQUIRED);
    const { schoolId, year } = input;

    const school = await this.prisma.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { schoolYearStartMonth: true, currencyCode: true },
    });
    const students = await this.scopeStudents(input);

    const assignments = await this.prisma.feeAssignment.findMany({
      where: { year, feeItem: { schoolId, active: true } },
      select: {
        feeItemId: true,
        degreeId: true,
        studyPlanId: true,
        amountOverride: true,
        feeItem: { select: { name: true, amount: true, schedule: true, dueMonth: true, startMonth: true, endMonth: true, dueDay: true } },
      },
    });
    const itemOf = new Map(assignments.map((a) => [a.feeItemId, a.feeItem]));
    const planAssignments = assignments.map((a) => ({
      feeItemId: a.feeItemId,
      degreeId: a.degreeId,
      studyPlanId: a.studyPlanId,
      amountOverride: a.amountOverride == null ? null : cents(a.amountOverride),
      itemAmount: cents(a.feeItem.amount),
    }));

    const existing = students.length
      ? await this.prisma.charge.findMany({
          where: { studentId: { in: students.map((s) => s.id) }, year, feeItemId: { not: null } },
          select: { studentId: true, feeItemId: true, installment: true },
        })
      : [];
    const existingKeys = new Set(existing.map((c) => `${c.studentId}|${c.feeItemId}|${c.installment}`));

    const feesOfPlan = new Map<string, ReturnType<typeof feesForPlan>>();
    const planned: PlannedCharge[] = [];
    for (const s of students) {
      if (!feesOfPlan.has(s.studyPlanId)) feesOfPlan.set(s.studyPlanId, feesForPlan(planAssignments, { id: s.studyPlanId, degreeId: s.degreeId }));
      for (const fee of feesOfPlan.get(s.studyPlanId)!) {
        const item = itemOf.get(fee.feeItemId)!;
        for (const inst of installments(item, year, school.schoolYearStartMonth)) {
          planned.push({
            studentId: s.id,
            feeItemId: fee.feeItemId,
            installment: inst.index,
            description: installmentDescription(item.name, item.schedule, inst),
            amount: fee.amount,
            dueDate: inst.dueDate,
            exists: existingKeys.has(`${s.id}|${fee.feeItemId}|${inst.index}`),
          });
        }
      }
    }
    planned.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return { students, planned, currencyCode: school.currencyCode };
  }

  private async scopeStudents(input: GenerateChargesInput): Promise<ScopeStudent[]> {
    const { schoolId } = input;
    const select = {
      id: true,
      firstName: true,
      fatherName: true,
      schoolId: true,
      enrollmentStatus: true,
      classGroup: { select: { name: true, studyPlanId: true, studyPlan: { select: { degreeId: true } } } },
    } as const satisfies Prisma.StudentSelect;
    let rows: Prisma.StudentGetPayload<{ select: typeof select }>[];

    if (input.studentId) {
      const student = await this.prisma.student.findUnique({ where: { id: input.studentId }, select });
      if (!student) throw new NotFoundException('Estudiante no encontrado');
      if (student.schoolId !== schoolId) throw new BadRequestException(STUDENT_NOT_IN_SCHOOL);
      if (student.enrollmentStatus !== EnrollmentStatus.ACTIVE) throw new BadRequestException(STUDENT_NOT_ACTIVE);
      if (!student.classGroup) throw new BadRequestException(STUDENT_WITHOUT_GROUP);
      rows = [student];
    } else {
      if (input.classGroupId) {
        const group = await this.prisma.classGroup.findUnique({ where: { id: input.classGroupId }, select: { schoolId: true } });
        if (!group) throw new NotFoundException('Grupo no encontrado');
        if (group.schoolId !== schoolId) throw new BadRequestException(GROUP_NOT_IN_SCHOOL);
      } else {
        const plan = await this.prisma.studyPlan.findUnique({ where: { id: input.studyPlanId }, select: { schoolId: true } });
        if (!plan) throw new NotFoundException('Plan de estudio no encontrado');
        if (plan.schoolId !== schoolId) throw new BadRequestException(PLAN_NOT_IN_SCHOOL);
      }
      // Students not ACTIVE are skipped (BR-FIN-001.5).
      rows = await this.prisma.student.findMany({
        where: {
          schoolId,
          enrollmentStatus: EnrollmentStatus.ACTIVE,
          ...(input.classGroupId ? { classGroupId: input.classGroupId } : { classGroup: { studyPlanId: input.studyPlanId } }),
        },
        orderBy: [{ fatherName: 'asc' }, { firstName: 'asc' }],
        select,
      });
    }

    return rows
      .filter((s) => s.classGroup)
      .map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.fatherName}`.trim(),
        classGroup: s.classGroup!.name,
        studyPlanId: s.classGroup!.studyPlanId,
        degreeId: s.classGroup!.studyPlan.degreeId,
      }));
  }
}
