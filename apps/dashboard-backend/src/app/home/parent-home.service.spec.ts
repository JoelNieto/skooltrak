import { ForbiddenException } from '@nestjs/common';
import { ParentHomeService } from './parent-home.service';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

/** HOM-001-S06: parent switcher, alerts and KPIs for linked children (BR-HOM-001.9, .14, .16). */
describe('ParentHomeService (HOM-001-S06)', () => {
  const parentUser = { userId: 'user-parent', organizationId: 'org-1', role: 'PARENT', permissions: ['VIEW_GRADES', 'VIEW_FINANCIALS'] };
  const decimal = (n: number) => ({ toNumber: () => n });

  const local = { timezone: 'America/Panama', date: '2026-11-16', time: '09:15', weekday: 'MONDAY', weekStart: '2026-11-16', weekEnd: '2026-11-22' };
  const ctxFor = (id: string) => ({
    organizationId: 'org-1',
    userId: null,
    student: { id, firstName: id, classGroup: { id: 'cg', name: '7°A' }, school: { id: 'school-1', currentYear: 2026, timezone: 'America/Panama' } },
    local,
  });

  const progress = (opts: { below?: boolean } = {}) => ({
    studentId: 'x',
    period: { id: 'p2', name: 'II Trimestre' },
    previousPeriod: { id: 'p1', name: 'I Trimestre' },
    scale: { maximum: 5, minimumApproval: 3, minimumExcellence: 4.5 },
    average: { value: 3.6, previous: 3.9, delta: -0.3 },
    courses: [{ id: 'c-math', name: 'Matemáticas', average: opts.below ? 2.8 : 4, band: opts.below ? 'BELOW' : 'PASSING' }],
    recentGrades: [],
    attendance: { rate: 0.92, absences: 1, late: 3 },
    messages: { unread: 0, fromTeachers: 0, broadcasts: 0 },
    habits: null,
  });
  const work = (overdue: number) => ({
    timezone: 'America/Panama',
    today: '2026-11-16',
    classGroup: { id: 'cg', name: '7°A' },
    items: [
      ...Array.from({ length: overdue }, (_, i) => ({
        assignmentId: `o${i}`,
        title: `Vencida ${i}`,
        course: { id: 'c-sci', name: 'Ciencias' },
        status: 'VENCIDA',
      })),
      { assignmentId: 'p', title: 'Pendiente', course: { id: 'c-sci', name: 'Ciencias' }, status: 'PENDIENTE' },
      { assignmentId: 'e', title: 'Entregada', course: { id: 'c-sci', name: 'Ciencias' }, status: 'ENTREGADO' },
    ],
  });

  function build(
    opts: {
      parents?: unknown[];
      linked?: unknown;
      facts?: Record<string, { below?: boolean; overdue?: number; absences?: unknown[]; late?: number; charges?: unknown[]; payments?: unknown[] }>;
      threads?: unknown[];
    } = {},
  ) {
    const facts = opts.facts ?? {};
    const prisma = {
      parent: { findMany: jest.fn().mockResolvedValue(opts.parents ?? []) },
      user: { findUnique: jest.fn().mockResolvedValue({ firstName: 'María', name: 'María Pérez' }) },
      student: { findFirst: jest.fn().mockResolvedValue(opts.linked ?? null) },
      attendanceRecord: {
        findMany: jest.fn().mockImplementation(({ where }) => Promise.resolve(facts[where.studentId]?.absences ?? [])),
        count: jest.fn().mockImplementation(({ where }) => Promise.resolve(facts[where.studentId]?.late ?? 0)),
      },
      school: { findUnique: jest.fn().mockResolvedValue({ currencyCode: 'USD' }) },
      charge: { findMany: jest.fn().mockImplementation(({ where }) => Promise.resolve(facts[where.studentId]?.charges ?? [])) },
      payment: { findMany: jest.fn().mockImplementation(({ where }) => Promise.resolve(facts[where.studentId]?.payments ?? [])) },
      communicationThread: { findMany: jest.fn().mockResolvedValue(opts.threads ?? []) },
    };
    const studentHome = {
      contextForStudent: jest.fn().mockImplementation((id: string) => Promise.resolve(ctxFor(id))),
      workFor: jest.fn().mockImplementation((ctx) => Promise.resolve(work(facts[ctx.student.id]?.overdue ?? 0))),
      progressFor: jest.fn().mockImplementation((ctx) => Promise.resolve(progress({ below: facts[ctx.student.id]?.below }))),
    };
    return { service: new ParentHomeService(prisma as never, studentHome as never), prisma, studentHome };
  }

  const kid = (id: string, firstName: string) => ({
    id,
    organizationId: 'org-1',
    firstName,
    fatherName: 'Pérez',
    classGroup: { id: 'cg', name: '7°A' },
    school: { id: 'school-1', name: 'Colegio' },
  });

  describe('children (FR-HOM-001.18)', () => {
    it('lists linked children across parent records with alert counts and picks the one with most alerts', async () => {
      const { service, prisma } = build({
        parents: [{ students: [kid('st-sofia', 'Sofía'), kid('st-mateo', 'Mateo')] }, { students: [kid('st-mateo', 'Mateo')] }],
        facts: { 'st-mateo': { below: true, overdue: 1 }, 'st-sofia': { overdue: 1 } },
      });

      const result = await service.children(parentUser);

      expect(prisma.parent.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-parent' } }));
      expect(result.firstName).toBe('María');
      expect(result.children.map((c) => [c.studentId, c.alertCount])).toEqual([
        ['st-mateo', 2],
        ['st-sofia', 1],
      ]);
      expect(result.defaultStudentId).toBe('st-mateo');
    });

    it('breaks ties alphabetically', async () => {
      const { service } = build({
        parents: [{ students: [kid('st-sofia', 'Sofía'), kid('st-ana', 'Ana')] }],
        facts: { 'st-sofia': { overdue: 1 }, 'st-ana': { overdue: 1 } },
      });

      expect((await service.children(parentUser)).defaultStudentId).toBe('st-ana');
    });

    it('refuses a user without parent records', async () => {
      const { service } = build({ parents: [] });

      await expect(service.children(parentUser)).rejects.toThrow(new ForbiddenException('No parent profile'));
    });
  });

  describe('child details (FR-HOM-001.21, .23)', () => {
    const linked = kid('st-sofia', 'Sofía');

    it('asks for 4 recent grades and lists the teacher threads about this child', async () => {
      const msg = (senderId: string, createdAt: string, body = 'Hola') => ({
        body,
        createdAt: new Date(createdAt),
        senderId,
        sender: { name: senderId === 'user-parent' ? 'María Pérez' : 'Carlos Méndez', firstName: null, lastName: null },
      });
      const { service, prisma, studentHome } = build({
        linked,
        threads: [
          { id: 't-old', title: 'Taller', participants: [{ lastReadAt: new Date('2026-11-15') }], messages: [msg('user-teacher', '2026-11-14T10:00:00Z')] },
          { id: 't-new', title: 'Reunión', participants: [{ lastReadAt: null }], messages: [msg('user-teacher', '2026-11-16T10:00:00Z', 'x'.repeat(200))] },
          { id: 't-mine', title: 'Respuesta', participants: [{ lastReadAt: null }], messages: [msg('user-parent', '2026-11-16T11:00:00Z')] },
          { id: 't-empty', title: 'Vacío', participants: [], messages: [] },
        ],
      });

      const home = await service.child(parentUser, 'st-sofia');

      expect(studentHome.progressFor).toHaveBeenCalledWith(expect.anything(), { recentGrades: 4 });
      expect(prisma.communicationThread.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: 'STUDENT_GUARDIANS',
            scopeId: 'st-sofia',
            broadcast: false,
            deletedAt: null,
            participants: { some: { userId: 'user-parent' } },
          },
        }),
      );
      expect(home.messages.map((m) => [m.id, m.unread])).toEqual([
        ['t-mine', false],
        ['t-new', true],
        ['t-old', false],
      ]);
      expect(home.messages[1].preview).toHaveLength(140);
      expect(home.messages[1].senderName).toBe('Carlos Méndez');
      expect(home.work.map((w) => w.status)).toEqual(['PENDIENTE', 'ENTREGADO']);
    });
  });

  describe('account (FR-HOM-001.22)', () => {
    const linked = kid('st-sofia', 'Sofía');
    const charge = (id: string, amount: number, due: string, description = id) => ({
      id,
      amount: decimal(amount),
      dueDate: new Date(`${due}T00:00:00Z`),
      description,
    });

    it('is "Pendiente" with the next charge when nothing is overdue', async () => {
      const { service } = build({
        linked,
        facts: { 'st-sofia': { charges: [charge('dic', 285, '2026-12-01', 'Mensualidad diciembre')], payments: [] } },
      });

      expect(await service.account(parentUser, 'st-sofia')).toEqual({
        currencyCode: 'USD',
        status: 'PENDIENTE',
        balance: 285,
        overdue: 0,
        nextCharge: { description: 'Mensualidad diciembre', outstanding: 285, dueDate: '2026-12-01' },
        lastPayment: null,
      });
    });

    it('is "Vencido" when a charge is overdue, and still shows the next upcoming one', async () => {
      const { service } = build({
        linked,
        facts: {
          'st-sofia': {
            charges: [charge('nov', 285, '2026-11-01'), charge('dic', 285, '2026-12-01')],
            payments: [{ chargeId: 'nov', amount: decimal(85), paidAt: new Date('2026-11-03T00:00:00Z') }],
          },
        },
      });

      const account = await service.account(parentUser, 'st-sofia');

      expect(account).toMatchObject({ status: 'VENCIDO', balance: 485, overdue: 200, lastPayment: { amount: 85, paidAt: '2026-11-03' } });
      expect(account.nextCharge?.description).toBe('dic');
    });

    it('is "Al día" with nothing owed', async () => {
      const { service } = build({
        linked,
        facts: {
          'st-sofia': {
            charges: [charge('nov', 285, '2026-11-01')],
            payments: [{ chargeId: 'nov', amount: decimal(285), paidAt: new Date('2026-11-02T00:00:00Z') }],
          },
        },
      });

      expect(await service.account(parentUser, 'st-sofia')).toMatchObject({ status: 'AL_DIA', balance: 0, nextCharge: null });
    });

    it('refuses a student not linked to the caller', async () => {
      const { service, prisma } = build({ linked: null });

      await expect(service.account(parentUser, 'st-other')).rejects.toThrow(ForbiddenException);
      expect(prisma.charge.findMany).not.toHaveBeenCalled();
    });
  });

  describe('child (FR-HOM-001.19, .20)', () => {
    const linked = kid('st-sofia', 'Sofía');

    it('refuses a student that is not linked to the caller and reads nothing about them', async () => {
      const { service, prisma, studentHome } = build({ linked: null });

      await expect(service.child(parentUser, 'st-other')).rejects.toThrow(
        new ForbiddenException('No puedes ver la información de este estudiante'),
      );
      expect(prisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'st-other', parents: { some: { userId: 'user-parent' } } } }),
      );
      expect(studentHome.contextForStudent).not.toHaveBeenCalled();
    });

    it('builds alerts, danger first, and the KPIs including balance', async () => {
      const { service } = build({
        linked,
        facts: {
          'st-sofia': {
            below: true,
            overdue: 2,
            late: 3,
            absences: [{ attendanceSession: { date: new Date('2026-11-13T00:00:00Z'), course: { name: 'Ciencias' } } }],
            charges: [
              { id: 'ch-past', amount: decimal(285), dueDate: new Date('2026-11-01T00:00:00Z'), description: 'Mensualidad noviembre' },
              { id: 'ch-soon', amount: decimal(285), dueDate: new Date('2026-11-19T00:00:00Z'), description: 'Mensualidad diciembre' },
              { id: 'ch-later', amount: decimal(285), dueDate: new Date('2026-12-30T00:00:00Z'), description: 'Enero' },
              { id: 'ch-paid', amount: decimal(100), dueDate: new Date('2026-10-01T00:00:00Z'), description: 'Matrícula' },
            ],
            payments: [
              { chargeId: 'ch-paid', amount: decimal(100) },
              { chargeId: 'ch-past', amount: decimal(85) },
            ],
          },
        },
      });

      const home = await service.child(parentUser, 'st-sofia');

      expect(home.alerts.map((a) => [a.kind, a.tone, a.title])).toEqual([
        ['ABSENCE', 'danger', 'Ausencia sin justificar'],
        ['BELOW_PASS', 'danger', 'Nota baja en Matemáticas'],
        ['CHARGE_OVERDUE', 'danger', 'Pago vencido'],
        ['OVERDUE_WORK', 'warning', '2 tareas vencidas'],
        ['CHARGE_DUE_SOON', 'warning', 'Pago próximo a vencer'],
        ['LATE', 'warning', '3 tardanzas esta semana'],
      ]);
      expect(home.alerts[0].detail).toBe('Viernes, 13 nov · Ciencias');
      expect(home.alerts[1].detail).toBe('Promedio 2.8 · mínimo para aprobar 3.0');
      expect(home.alerts[2].action).toEqual({ label: 'Ver estado de cuenta', link: '/parent/finances' });
      expect(home.kpis).toEqual({
        average: { value: 3.6, max: 5, delta: -0.3, previousPeriodName: 'I Trimestre' },
        attendance: { rate: 0.92, absences: 1, late: 3 },
        pending: { total: 3, overdue: 2 },
        balance: { amount: 770, overdue: 200 }, // 955 charged − 185 paid; November still owes 200
      });
    });

    it('omits finance alerts and balance without VIEW_FINANCIALS', async () => {
      const { service, prisma } = build({
        linked,
        facts: { 'st-sofia': { charges: [{ id: 'c', amount: decimal(10), dueDate: new Date('2026-11-01'), description: 'x' }] } },
      });

      const home = await service.child({ ...parentUser, permissions: ['VIEW_GRADES'] }, 'st-sofia');

      expect(home.kpis.balance).toBeNull();
      expect(home.alerts.some((a) => a.kind.startsWith('CHARGE'))).toBe(false);
      expect(prisma.charge.findMany).not.toHaveBeenCalled();
    });

    it('has no alerts when all is well', async () => {
      const { service } = build({ linked, facts: { 'st-sofia': { late: 2 } } });

      expect((await service.child(parentUser, 'st-sofia')).alerts).toEqual([]);
    });
  });
});
