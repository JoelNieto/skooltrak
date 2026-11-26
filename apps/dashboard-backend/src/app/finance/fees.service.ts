import { AuthUserContext } from '@/auth';
import { FeeSchedule, Prisma } from '@generated/prisma';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { cents, fromCents } from './charge-status';
import { CreateFeeAssignmentInput, CreateFeeItemInput, UpdateFeeItemInput } from './dto/fees.input';
import { FeeAssignmentView, FeeItemList, FeeItemView, FeeTargets } from './entities/fees.entity';
import { FeeScheduleSpec, scheduleError, scheduleLabel } from './fee-schedule';

export const FEE_NAME_TAKEN = 'Ya existe un concepto con ese nombre';
export const FEE_LOCKED = 'El concepto ya tiene cargos generados; crea uno nuevo';
export const FEE_INACTIVE = 'El concepto está inactivo';
export const ASSIGNMENT_TARGET_REQUIRED = 'Indica un nivel o un plan de estudio, no ambos';
export const ASSIGNMENT_DUPLICATE = 'Ya está asignado';
export const TARGET_NOT_IN_SCHOOL = 'El nivel o plan de estudio no pertenece a esta escuela';

const ITEM_SELECT = {
  id: true,
  schoolId: true,
  name: true,
  kind: true,
  amount: true,
  schedule: true,
  dueMonth: true,
  startMonth: true,
  endMonth: true,
  dueDay: true,
  active: true,
  _count: { select: { charges: true } },
} as const satisfies Prisma.FeeItemSelect;

type ItemRow = Prisma.FeeItemGetPayload<{ select: typeof ITEM_SELECT }>;

/** Keeps only the calendar fields that apply to the schedule. */
function normalizeSpec(spec: FeeScheduleSpec): FeeScheduleSpec {
  return spec.schedule === FeeSchedule.ONE_TIME
    ? { schedule: spec.schedule, dueMonth: spec.dueMonth, startMonth: null, endMonth: null, dueDay: spec.dueDay }
    : { schedule: spec.schedule, dueMonth: null, startMonth: spec.startMonth, endMonth: spec.endMonth, dueDay: spec.dueDay };
}

function toView(row: ItemRow): FeeItemView {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    amount: fromCents(cents(row.amount)),
    schedule: row.schedule,
    dueMonth: row.dueMonth,
    startMonth: row.startMonth,
    endMonth: row.endMonth,
    dueDay: row.dueDay,
    active: row.active,
    scheduleLabel: scheduleLabel(row),
    chargeCount: row._count.charges,
  };
}

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

/**
 * Fee catalog and its assignments to degrees and study plans (FR-FIN-001.4, .5). The caller must
 * already be a finance manager of the school (finance.controller.ts).
 */
@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  async listItems(schoolId: string): Promise<FeeItemList> {
    const [school, rows] = await Promise.all([
      this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { currencyCode: true } }),
      this.prisma.feeItem.findMany({ where: { schoolId }, select: ITEM_SELECT, orderBy: [{ active: 'desc' }, { name: 'asc' }] }),
    ]);
    return { items: rows.map(toView), currencyCode: school.currencyCode };
  }

  /** The item's school, for the controller's access check (404 when it doesn't exist). */
  async itemSchool(id: string): Promise<string> {
    const item = await this.prisma.feeItem.findUnique({ where: { id }, select: { schoolId: true } });
    if (!item) throw new NotFoundException('Concepto no encontrado');
    return item.schoolId;
  }

  async assignmentSchool(id: string): Promise<string> {
    const a = await this.prisma.feeAssignment.findUnique({ where: { id }, select: { feeItem: { select: { schoolId: true } } } });
    if (!a) throw new NotFoundException('Asignación no encontrada');
    return a.feeItem.schoolId;
  }

  async createItem(user: AuthUserContext | undefined, organizationId: string, input: CreateFeeItemInput): Promise<FeeItemView> {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('El nombre es obligatorio');
    const spec = normalizeSpec({
      schedule: input.schedule,
      dueMonth: input.dueMonth ?? null,
      startMonth: input.startMonth ?? null,
      endMonth: input.endMonth ?? null,
      dueDay: input.dueDay,
    });
    const error = scheduleError(spec);
    if (error) throw new BadRequestException(error);
    const amount = Math.round(input.amount * 100) / 100;
    if (!(amount > 0)) throw new BadRequestException('El monto debe ser mayor que cero');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.feeItem.create({
          data: { schoolId: input.schoolId, name, kind: input.kind, amount, ...spec },
          select: ITEM_SELECT,
        });
        await tx.financeAuditLog.create({
          data: {
            organizationId,
            schoolId: input.schoolId,
            actorId: user?.userId ?? null,
            action: 'FEE_ITEM_CREATE',
            entity: 'FeeItem',
            entityId: row.id,
            payload: { name, kind: input.kind, amount, ...spec },
          },
        });
        return toView(row);
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException(FEE_NAME_TAKEN);
      throw e;
    }
  }

  async updateItem(user: AuthUserContext | undefined, organizationId: string, id: string, input: UpdateFeeItemInput): Promise<FeeItemView> {
    const current = await this.prisma.feeItem.findUnique({ where: { id }, select: ITEM_SELECT });
    if (!current) throw new NotFoundException('Concepto no encontrado');

    const calendarChange =
      (input.kind !== undefined && input.kind !== current.kind) ||
      (input.schedule !== undefined && input.schedule !== current.schedule) ||
      (input.dueMonth !== undefined && input.dueMonth !== current.dueMonth) ||
      (input.startMonth !== undefined && input.startMonth !== current.startMonth) ||
      (input.endMonth !== undefined && input.endMonth !== current.endMonth) ||
      (input.dueDay !== undefined && input.dueDay !== current.dueDay);
    if (calendarChange && current._count.charges > 0) throw new ConflictException(FEE_LOCKED);

    const data: Prisma.FeeItemUpdateInput = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new BadRequestException('El nombre es obligatorio');
      data.name = name;
    }
    if (input.amount !== undefined) data.amount = Math.round(input.amount * 100) / 100;
    if (input.active !== undefined) data.active = input.active;
    if (input.kind !== undefined) data.kind = input.kind;
    if (calendarChange) {
      const spec = normalizeSpec({
        schedule: input.schedule ?? current.schedule,
        dueMonth: input.dueMonth ?? current.dueMonth,
        startMonth: input.startMonth ?? current.startMonth,
        endMonth: input.endMonth ?? current.endMonth,
        dueDay: input.dueDay ?? current.dueDay,
      });
      const error = scheduleError(spec);
      if (error) throw new BadRequestException(error);
      Object.assign(data, { schedule: spec.schedule, dueMonth: spec.dueMonth, startMonth: spec.startMonth, endMonth: spec.endMonth, dueDay: spec.dueDay });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.feeItem.update({ where: { id }, data, select: ITEM_SELECT });
        await tx.financeAuditLog.create({
          data: {
            organizationId,
            schoolId: current.schoolId,
            actorId: user?.userId ?? null,
            action: 'FEE_ITEM_UPDATE',
            entity: 'FeeItem',
            entityId: id,
            payload: input as unknown as Prisma.InputJsonValue,
          },
        });
        return toView(row);
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException(FEE_NAME_TAKEN);
      throw e;
    }
  }

  async listAssignments(schoolId: string, year: number): Promise<FeeAssignmentView[]> {
    const rows = await this.prisma.feeAssignment.findMany({
      where: { year, feeItem: { schoolId } },
      select: {
        id: true,
        year: true,
        amountOverride: true,
        feeItem: { select: { id: true, name: true, amount: true } },
        degree: { select: { id: true, name: true } },
        studyPlan: { select: { id: true, name: true, degreeId: true, level: true } },
      },
    });
    return rows
      .map((r) => ({
        id: r.id,
        year: r.year,
        feeItem: { id: r.feeItem.id, name: r.feeItem.name },
        degree: r.degree,
        studyPlan: r.studyPlan ? { id: r.studyPlan.id, name: r.studyPlan.name, degreeId: r.studyPlan.degreeId } : null,
        amountOverride: r.amountOverride == null ? null : fromCents(cents(r.amountOverride)),
        amount: fromCents(cents(r.amountOverride ?? r.feeItem.amount)),
        level: r.studyPlan?.level ?? -1,
      }))
      .sort(
        (a, b) =>
          a.feeItem.name.localeCompare(b.feeItem.name, 'es') ||
          a.level - b.level ||
          (a.degree?.name ?? a.studyPlan?.name ?? '').localeCompare(b.degree?.name ?? b.studyPlan?.name ?? '', 'es'),
      )
      .map(({ level: _level, ...view }) => view);
  }

  async createAssignment(user: AuthUserContext | undefined, organizationId: string, schoolId: string, input: CreateFeeAssignmentInput): Promise<FeeAssignmentView> {
    if (!input.degreeId === !input.studyPlanId) throw new BadRequestException(ASSIGNMENT_TARGET_REQUIRED);
    const item = await this.prisma.feeItem.findUnique({ where: { id: input.feeItemId }, select: { schoolId: true, active: true } });
    if (!item || item.schoolId !== schoolId) throw new NotFoundException('Concepto no encontrado');
    if (!item.active) throw new BadRequestException(FEE_INACTIVE);
    const target = input.degreeId
      ? await this.prisma.degree.findUnique({ where: { id: input.degreeId }, select: { schoolId: true } })
      : await this.prisma.studyPlan.findUnique({ where: { id: input.studyPlanId }, select: { schoolId: true } });
    if (!target || target.schoolId !== schoolId) throw new BadRequestException(TARGET_NOT_IN_SCHOOL);
    const amountOverride = input.amountOverride == null ? null : Math.round(input.amountOverride * 100) / 100;

    try {
      const id = await this.prisma.$transaction(async (tx) => {
        const row = await tx.feeAssignment.create({
          data: {
            feeItemId: input.feeItemId,
            year: input.year,
            degreeId: input.degreeId ?? null,
            studyPlanId: input.studyPlanId ?? null,
            amountOverride,
          },
          select: { id: true },
        });
        await tx.financeAuditLog.create({
          data: {
            organizationId,
            schoolId,
            actorId: user?.userId ?? null,
            action: 'FEE_ASSIGNMENT_CREATE',
            entity: 'FeeAssignment',
            entityId: row.id,
            payload: { ...input, amountOverride },
          },
        });
        return row.id;
      });
      const views = await this.listAssignments(schoolId, input.year);
      return views.find((v) => v.id === id)!;
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException(ASSIGNMENT_DUPLICATE);
      throw e;
    }
  }

  /** Charges already generated from the assignment stay as they are (BR-FIN-001.5). */
  async deleteAssignment(user: AuthUserContext | undefined, organizationId: string, schoolId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.feeAssignment.delete({ where: { id }, select: { feeItemId: true, year: true, degreeId: true, studyPlanId: true } });
      await tx.financeAuditLog.create({
        data: {
          organizationId,
          schoolId,
          actorId: user?.userId ?? null,
          action: 'FEE_ASSIGNMENT_DELETE',
          entity: 'FeeAssignment',
          entityId: id,
          payload: row,
        },
      });
    });
  }

  async targets(schoolId: string): Promise<FeeTargets> {
    const [school, degrees] = await Promise.all([
      this.prisma.school.findUniqueOrThrow({ where: { id: schoolId }, select: { currentYear: true, currencyCode: true } }),
      this.prisma.degree.findMany({
        where: { schoolId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          studyPlans: {
            orderBy: [{ level: 'asc' }, { name: 'asc' }],
            select: {
              id: true,
              name: true,
              classGroups: { where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);
    return { degrees, currentYear: school.currentYear, currencyCode: school.currencyCode };
  }
}
