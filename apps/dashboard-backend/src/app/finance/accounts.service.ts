import { AuthUserContext } from '@/auth';
import { Prisma } from '@generated/prisma';
import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CLOCK, Clock, daysBetween, schoolLocalTime } from '../home/home-time';
import { PrismaService } from '../prisma.service';
import { planAccountSync } from './account-sync';
import { accountNumber, cents, chargeStatus, fromCents, outstandingCents } from './charge-status';
import {
  FinanceAccountDetail,
  FinanceAccountList,
  FinanceAccountSummary,
  FinanceCharge,
} from './entities/finance.entity';
import { ACCOUNT_DENIED, FINANCE_DENIED, isFinanceStaff } from './finance-access';

const ACCOUNT_INCLUDE = {
  school: { select: { id: true, name: true, currencyCode: true, timezone: true } },
  students: {
    orderBy: { createdAt: 'asc' },
    select: {
      student: {
        select: {
          id: true,
          firstName: true,
          fatherName: true,
          motherName: true,
          documentId: true,
          classGroup: { select: { id: true, name: true } },
          parents: {
            select: {
              id: true,
              firstName: true,
              fatherName: true,
              documentId: true,
              relationship: true,
              userId: true,
            },
          },
        },
      },
    },
  },
} as const satisfies Prisma.FamilyAccountInclude;

type AccountRow = Prisma.FamilyAccountGetPayload<{ include: typeof ACCOUNT_INCLUDE }>;

interface Totals {
  due: number;
  overdue: number;
  oldestOverdue: string | null;
}

const PAGE_SIZE = 25;

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * Brings the school's family accounts in line with its parent ↔ student links
   * (FR-FIN-001.1). Runs before every account read, so links made anywhere (onboarding, imports,
   * the parents directory) are picked up without hooks. Writes only when something changed.
   */
  async sync(schoolId: string): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.syncOnce(schoolId);
        return;
      } catch (error) {
        // Two syncs racing for the same account number or student: the loser retries.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && attempt < 2) continue;
        throw error;
      }
    }
  }

  private async syncOnce(schoolId: string): Promise<void> {
    const [school, students, accounts, links] = await Promise.all([
      this.prisma.school.findUnique({ where: { id: schoolId }, select: { organizationId: true } }),
      this.prisma.student.findMany({
        where: { schoolId },
        select: { id: true, createdAt: true, parents: { select: { id: true } } },
      }),
      this.prisma.familyAccount.findMany({
        where: { schoolId },
        select: { id: true, number: true, _count: { select: { charges: true } } },
      }),
      this.prisma.familyAccountStudent.findMany({ where: { schoolId }, select: { studentId: true, accountId: true } }),
    ]);
    if (!school) throw new NotFoundException('Escuela no encontrada');
    const plan = planAccountSync(
      students.map((s) => ({ id: s.id, createdAt: s.createdAt, parentIds: s.parents.map((p) => p.id) })),
      accounts.map((a) => ({ id: a.id, number: a.number, chargeCount: a._count.charges })),
      links,
    );
    if (!plan.create.length && !plan.assign.length && !plan.remove.length) return;

    await this.prisma.$transaction(async (tx) => {
      const ids = new Map<string, string>();
      for (const c of plan.create) {
        const created = await tx.familyAccount.create({
          data: { organizationId: school.organizationId, schoolId, number: c.number },
          select: { id: true },
        });
        ids.set(c.tempId, created.id);
      }
      for (const a of plan.assign) {
        const accountId = ids.get(a.accountId) ?? a.accountId;
        await tx.familyAccountStudent.upsert({
          where: { studentId_schoolId: { studentId: a.studentId, schoolId } },
          create: { studentId: a.studentId, schoolId, accountId },
          update: { accountId },
        });
      }
      if (plan.remove.length) {
        await tx.familyAccount.deleteMany({ where: { id: { in: plan.remove }, schoolId, charges: { none: {} } } });
      }
    });
    this.logger.log(
      `Synced accounts of school ${schoolId}: +${plan.create.length} accounts, ${plan.assign.length} assignments, -${plan.remove.length}`,
    );
  }

  /** FR-FIN-001.2. The caller must already be finance staff of the school. */
  async list(
    schoolId: string,
    filters: { q?: string; overdue?: boolean; page?: number; take?: number },
  ): Promise<FinanceAccountList> {
    await this.sync(schoolId);
    const school = await this.prisma.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { currencyCode: true, timezone: true },
    });
    const today = this.today(school.timezone);
    const [accounts, totals] = await Promise.all([
      this.prisma.familyAccount.findMany({ where: { schoolId }, include: ACCOUNT_INCLUDE }),
      this.totals(schoolId, today),
    ]);

    const q = normalize(filters.q ?? '');
    let items = accounts
      .filter((a) => a.students.length > 0)
      .filter((a) => !q || searchText(a).includes(q))
      .map((a) => this.summary(a, totals.get(a.id), today));
    if (filters.overdue) items = items.filter((a) => a.overdueAmount > 0);
    items.sort((a, b) => b.overdueAmount - a.overdueAmount || a.name.localeCompare(b.name, 'es'));

    const take = Math.min(Math.max(filters.take ?? PAGE_SIZE, 1), 100);
    const page = Math.max(filters.page ?? 1, 1);
    return {
      items: items.slice((page - 1) * take, page * take),
      total: items.length,
      page,
      take,
      currencyCode: school.currencyCode,
    };
  }

  /** FR-FIN-001.3 / .12: finance staff of the account's organization, or one of its guardians. */
  async detail(user: AuthUserContext | undefined, accountId: string): Promise<FinanceAccountDetail> {
    const before = await this.prisma.familyAccount.findUnique({ where: { id: accountId }, include: ACCOUNT_INCLUDE });
    if (!before) throw new NotFoundException('Cuenta no encontrada');
    if (isFinanceStaff(user)) {
      if (user?.organizationId !== before.organizationId) throw new ForbiddenException(FINANCE_DENIED);
    } else if (!isGuardian(before, user?.userId)) {
      throw new ForbiddenException(ACCOUNT_DENIED);
    }
    await this.sync(before.schoolId);
    // The sync may have moved students in or out; an account it emptied no longer exists.
    const account = await this.prisma.familyAccount.findUnique({ where: { id: accountId }, include: ACCOUNT_INCLUDE });
    if (!account) throw new NotFoundException('Cuenta no encontrada');
    return this.detailOf(account);
  }

  /** FR-FIN-001.12: every account (one per school) holding a child linked to the caller. */
  async mine(user: AuthUserContext | undefined): Promise<FinanceAccountDetail[]> {
    if (!user?.userId) return [];
    const students = await this.prisma.student.findMany({
      where: { parents: { some: { userId: user.userId } } },
      select: { id: true, schoolId: true },
    });
    const schools = [...new Set(students.map((s) => s.schoolId))];
    for (const schoolId of schools) await this.sync(schoolId);
    const accounts = await this.prisma.familyAccount.findMany({
      where: { students: { some: { studentId: { in: students.map((s) => s.id) } } } },
      include: ACCOUNT_INCLUDE,
      orderBy: [{ school: { name: 'asc' } }, { number: 'asc' }],
    });
    return Promise.all(accounts.map((a) => this.detailOf(a)));
  }

  /** The account a student belongs to in their school, creating it when needed. */
  async accountOfStudent(schoolId: string, studentId: string): Promise<string> {
    await this.sync(schoolId);
    const link = await this.prisma.familyAccountStudent.findUnique({
      where: { studentId_schoolId: { studentId, schoolId } },
      select: { accountId: true },
    });
    if (!link) throw new NotFoundException('El estudiante no tiene cuenta familiar');
    return link.accountId;
  }

  private async detailOf(account: AccountRow): Promise<FinanceAccountDetail> {
    const today = this.today(account.school.timezone);
    const charges = await this.prisma.charge.findMany({
      where: { accountId: account.id },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
    const rows: FinanceCharge[] = charges.map((c) => ({
      id: c.id,
      studentId: c.studentId,
      description: c.description,
      source: c.source,
      year: c.year,
      dueDate: c.dueDate.toISOString().slice(0, 10),
      grossAmount: fromCents(cents(c.grossAmount)),
      discountAmount: fromCents(cents(c.discountAmount)),
      netAmount: fromCents(cents(c.netAmount)),
      paidAmount: fromCents(cents(c.paidAmount)),
      outstanding: fromCents(outstandingCents(c)),
      status: chargeStatus(c, today),
      cancelledAt: c.cancelledAt?.toISOString() ?? null,
      cancelReason: c.cancelReason,
    }));
    const totals = totalsOf(charges, today);
    const summary = this.summary(account, totals, today);
    return {
      ...summary,
      school: { id: account.school.id, name: account.school.name, currencyCode: account.school.currencyCode },
      charges: rows,
    };
  }

  private summary(account: AccountRow, totals: Totals | undefined, today: string): FinanceAccountSummary {
    const students = account.students.map((l) => l.student);
    const first = students[0];
    const guardians = new Map<string, FinanceAccountSummary['guardians'][number]>();
    for (const s of students)
      for (const p of s.parents)
        guardians.set(p.id, { id: p.id, name: `${p.firstName} ${p.fatherName}`.trim(), relationship: p.relationship });
    return {
      id: account.id,
      number: accountNumber(account.number),
      name: first ? `Familia ${[first.fatherName, first.motherName].filter(Boolean).join(' ')}` : accountNumber(account.number),
      students: students.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.fatherName}`.trim(),
        classGroup: s.classGroup ? { id: s.classGroup.id, name: s.classGroup.name } : null,
      })),
      guardians: [...guardians.values()],
      dueAmount: fromCents(totals?.due ?? 0),
      overdueAmount: fromCents(totals?.overdue ?? 0),
      overdueDays: totals?.oldestOverdue ? daysBetween(totals.oldestOverdue, today) : null,
      creditAmount: 0,
    };
  }

  /** Outstanding and overdue cents per account of the school. */
  private async totals(schoolId: string, today: string): Promise<Map<string, Totals>> {
    const charges = await this.prisma.charge.findMany({
      where: { schoolId, cancelledAt: null },
      select: { accountId: true, netAmount: true, paidAmount: true, dueDate: true, cancelledAt: true },
    });
    const byAccount = new Map<string, typeof charges>();
    for (const c of charges) byAccount.set(c.accountId, [...(byAccount.get(c.accountId) ?? []), c]);
    return new Map([...byAccount].map(([id, rows]) => [id, totalsOf(rows, today)]));
  }

  private today(timezone: string | null | undefined): string {
    return schoolLocalTime(this.clock.now(), timezone).date;
  }
}

function totalsOf(
  charges: { netAmount: Prisma.Decimal; paidAmount: Prisma.Decimal; dueDate: Date; cancelledAt: Date | null }[],
  today: string,
): Totals {
  let due = 0;
  let overdue = 0;
  let oldestOverdue: string | null = null;
  for (const c of charges) {
    const open = outstandingCents(c);
    if (!open) continue;
    due += open;
    const day = c.dueDate.toISOString().slice(0, 10);
    if (day < today) {
      overdue += open;
      if (!oldestOverdue || day < oldestOverdue) oldestOverdue = day;
    }
  }
  return { due, overdue, oldestOverdue };
}

function isGuardian(account: AccountRow, userId: string | undefined): boolean {
  if (!userId) return false;
  return account.students.some((l) => l.student.parents.some((p) => p.userId === userId));
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function searchText(account: AccountRow): string {
  const parts: string[] = [accountNumber(account.number)];
  for (const { student: s } of account.students) {
    parts.push(s.firstName, s.fatherName, s.motherName, s.documentId);
    for (const p of s.parents) parts.push(p.firstName, p.fatherName, p.documentId);
  }
  return normalize(parts.join(' '));
}
