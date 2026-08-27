import { Test, TestingModule } from '@nestjs/testing';
import { $Enums, Prisma } from '@generated/prisma';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    payment: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
    },
    charge: {
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recomputeChargeStatus', () => {
    it('marks a fully paid charge as PAID', async () => {
      prisma.charge.findUniqueOrThrow.mockResolvedValue({ amount: new Prisma.Decimal(100) });
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(100) } });

      await service.recomputeChargeStatus('c1');

      expect(prisma.charge.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: $Enums.ChargeStatus.PAID },
      });
    });

    it('marks a partially paid charge as PARTIAL', async () => {
      prisma.charge.findUniqueOrThrow.mockResolvedValue({ amount: new Prisma.Decimal(100) });
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(60) } });

      await service.recomputeChargeStatus('c1');

      expect(prisma.charge.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: $Enums.ChargeStatus.PARTIAL },
      });
    });

    it('keeps an unpaid charge as PENDING', async () => {
      prisma.charge.findUniqueOrThrow.mockResolvedValue({ amount: new Prisma.Decimal(100) });
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(0) } });

      await service.recomputeChargeStatus('c1');

      expect(prisma.charge.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: $Enums.ChargeStatus.PENDING },
      });
    });
  });

  describe('getStudentBalanceSummary', () => {
    it('splits outstanding amounts into overdue and active', async () => {
      const now = new Date();
      const past = new Date(now.getFullYear() - 1, 0, 1);
      const future = new Date(now.getFullYear() + 1, 0, 1);
      prisma.charge.findMany.mockResolvedValue([
        { id: 'c1', amount: new Prisma.Decimal(100), dueDate: past, description: 'Vencido', chargeType: 'CUSTOM' },
        { id: 'c2', amount: new Prisma.Decimal(50), dueDate: future, description: 'Pendiente', chargeType: 'CUSTOM' },
      ]);
      prisma.payment.findMany.mockResolvedValue([]);

      const summary = await service.getStudentBalanceSummary('s1');

      expect(summary.totalCharges).toBe(150);
      expect(summary.totalOverdue).toBe(100);
      expect(summary.totalActive).toBe(50);
      expect(summary.balance).toBe(150);
      expect(summary.charges[0].status).toBe($Enums.ChargeStatus.OVERDUE);
      expect(summary.charges[1].status).toBe($Enums.ChargeStatus.PENDING);
    });

    it('marks a charge PAID when payments cover it', async () => {
      const future = new Date(new Date().getFullYear() + 1, 0, 1);
      prisma.charge.findMany.mockResolvedValue([
        { id: 'c1', amount: new Prisma.Decimal(100), dueDate: future, description: 'Pago', chargeType: 'CUSTOM' },
      ]);
      prisma.payment.findMany.mockResolvedValue([
        { id: 'p1', amount: new Prisma.Decimal(100), chargeId: 'c1', paidAt: new Date(), reference: null },
      ]);

      const summary = await service.getStudentBalanceSummary('s1');

      expect(summary.totalPaid).toBe(100);
      expect(summary.balance).toBe(0);
      expect(summary.charges[0].status).toBe($Enums.ChargeStatus.PAID);
    });
  });
});
