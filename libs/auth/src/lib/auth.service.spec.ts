import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { PrismaService } from './prisma.service';
import { LinkChildInput } from './dto/link-child.input';

// Prevent loading of better-auth / @generated/prisma in the unit test
vi.mock('./better-auth', () => ({ auth: { api: {} } }));
vi.mock('./prisma.service', () => ({ PrismaService: class {} }));
vi.mock('./resend.service', () => ({ sendEmail: vi.fn(), sendUserInvitation: vi.fn() }));

function makePrismaMock(state: {
  student?: any;
  user?: any;
  existingParent?: any | null;
  parentRole?: any | null;
  parentsOfStudent?: { id: string; userId: string | null }[];
  createdParentId?: string;
}) {
  const calls = {
    parentCreate: 0,
    parentUpdate: 0,
    memberUpsert: 0,
    userUpdate: 0,
    studentConnect: 0,
  };
  let lastUserUpdateData: any = undefined;

  const mock: any = {
    calls,
    student: {
      findUnique: vi.fn().mockResolvedValue(state.student ?? null),
      findUniqueOrThrow: vi.fn().mockResolvedValue(state.student ?? null),
    },
    user: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(
        state.user ?? { firstName: 'Ana', lastName: 'Torres', email: 'a@b.com', organizationId: null, roleId: null },
      ),
      // Used by transitionOnboardingStep (current step lookup + persist).
      findUnique: vi.fn().mockResolvedValue({ onboardingStep: null }),
      update: vi.fn().mockResolvedValue({}),
    },
    parent: {
      findFirst: vi
        .fn()
        .mockImplementation((args: any) => {
          const org = args?.where?.organizationId;
          return state.existingParent &&
            (!org || state.existingParent.organizationId === org)
            ? state.existingParent
            : null;
        }),
      create: vi.fn().mockResolvedValue({ id: state.createdParentId ?? 'parent-new' }),
      update: vi.fn().mockResolvedValue({ id: 'parent-x' }),
    },
    role: {
      findFirst: vi.fn().mockResolvedValue(state.parentRole ?? { id: 'role-parent', name: 'PARENT', permissions: [] }),
    },
    member: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    onboardingAuditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(async (fn: (tx: any) => Promise<void>) => {
      const tx = {
        parent: {
          create: (...a: any[]) => {
            calls.parentCreate++;
            return mock.parent.create(...a);
          },
          update: (...a: any[]) => {
            calls.parentUpdate++;
            if (a[0]?.data?.students?.connect) calls.studentConnect++;
            return mock.parent.update(...a);
          },
        },
        member: {
          upsert: (...a: any[]) => {
            calls.memberUpsert++;
            return mock.member.upsert(...a);
          },
        },
        user: {
          update: (...a: any[]) => {
            calls.userUpdate++;
            lastUserUpdateData = a[0]?.data;
            return Promise.resolve({});
          },
        },
      };
      return fn(tx);
    }),
  };

  Object.defineProperty(mock, 'lastUserUpdateData', {
    get: () => lastUserUpdateData,
  });

  return mock;
}

const validInput: LinkChildInput = {
  enrollmentCode: 'ABC12345',
  firstName: 'Ana',
  fatherName: 'Torres',
  documentId: '8-123-4567',
  phone: '60000000',
  email: 'ana@test.com',
  relationship: 'PARENT',
};

const studentInOrg = (orgId: string, parents: { id: string; userId: string | null }[] = []) => ({
  id: 'student-1',
  enrollmentCode: 'ABC12345',
  schoolId: 'school-1',
  school: { id: 'school-1', name: 'Escuela', organizationId: orgId },
  parents,
});

describe('AuthService.linkChildByCode', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: AuthTokenService, useValue: {} },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('throws when the enrollment code is missing', async () => {
    const prisma = makePrismaMock({});
    (service as any).prisma = prisma;
    await expect(service.linkChildByCode('user-1', { enrollmentCode: '  ' } as LinkChildInput)).rejects.toThrow();
  });

  it('throws when no student matches the code', async () => {
    const prisma = makePrismaMock({ student: null });
    (service as any).prisma = prisma;
    await expect(service.linkChildByCode('user-1', validInput)).rejects.toThrow(/inválido/i);
  });

  it('rejects when the student already has 2 linked parents', async () => {
    const prisma = makePrismaMock({
      student: studentInOrg('org-1', [
        { id: 'p1', userId: 'u1' },
        { id: 'p2', userId: 'u2' },
      ]),
    });
    (service as any).prisma = prisma;
    await expect(service.linkChildByCode('user-1', validInput)).rejects.toThrow(/máximo/i);
  });

  it('returns LINKED and does not create when already linked', async () => {
    const prisma = makePrismaMock({
      student: studentInOrg('org-1', [{ id: 'p-existing', userId: 'user-1' }]),
      existingParent: { id: 'p-existing', userId: 'user-1', organizationId: 'org-1' },
    });
    (service as any).prisma = prisma;
    const result = await service.linkChildByCode('user-1', validInput);
    expect(result.status).toBe('LINKED');
    expect(prisma.calls.parentCreate).toBe(0);
  });

  it('creates a new per-org parent profile and links the student', async () => {
    const prisma = makePrismaMock({
      student: studentInOrg('org-1', []),
      existingParent: null,
      createdParentId: 'parent-new',
    });
    (service as any).prisma = prisma;
    const result = await service.linkChildByCode('user-1', validInput);
    expect(result.status).toBe('LINKED');
    expect(prisma.calls.parentCreate).toBe(1);
    expect(prisma.calls.studentConnect).toBe(1);
    expect(prisma.calls.memberUpsert).toBe(1);
    expect(prisma.calls.userUpdate).toBe(1);
    expect(result.organizationId).toBe('org-1');
  });

  it('creates a second parent profile for a different organization (federated)', async () => {
    const prisma = makePrismaMock({
      student: studentInOrg('org-2', []),
      // User already has a parent profile in org-1, but NOT in org-2
      existingParent: { id: 'p-org1', userId: 'user-1', organizationId: 'org-1' },
      createdParentId: 'parent-org2',
    });
    (service as any).prisma = prisma;
    const result = await service.linkChildByCode('user-1', validInput);
    expect(result.status).toBe('LINKED');
    expect(prisma.calls.parentCreate).toBe(1);
    expect(result.organizationId).toBe('org-2');
  });

  it('assigns the PARENT role to a fresh user with no role', async () => {
    const prisma = makePrismaMock({
      student: studentInOrg('org-1', []),
      existingParent: null,
      user: { firstName: 'Ana', lastName: 'Torres', email: 'a@b.com', organizationId: null, roleId: null },
    });
    (service as any).prisma = prisma;
    await service.linkChildByCode('user-1', validInput);
    expect(prisma.lastUserUpdateData.roleId).toBe('role-parent');
  });

  it('links an existing PARENT without changing their role', async () => {
    const prisma = makePrismaMock({
      student: studentInOrg('org-1', []),
      existingParent: null,
      user: {
        firstName: 'Pat',
        lastName: 'Parent',
        email: 'parent@b.com',
        organizationId: 'org-1',
        roleId: 'role-parent',
        role: { name: 'PARENT' },
      },
    });
    (service as any).prisma = prisma;
    const result = await service.linkChildByCode('user-1', validInput);
    expect(result.status).toBe('LINKED');
    expect(prisma.calls.parentCreate).toBe(1);
  });

  it.each(['ORG_ADMIN', 'TEACHER', 'STUDENT'])(
    'blocks a %s account from linking as a parent',
    async (roleName) => {
      const prisma = makePrismaMock({
        student: studentInOrg('org-1', []),
        existingParent: null,
        user: {
          firstName: 'Staff',
          lastName: 'User',
          email: 'staff@b.com',
          organizationId: 'org-1',
          roleId: `role-${roleName}`,
          role: { name: roleName },
        },
      });
      (service as any).prisma = prisma;
      await expect(service.linkChildByCode('user-1', validInput)).rejects.toThrow(/padre\/tutor/i);
      // No parent profile or link is created for a blocked account.
      expect(prisma.calls.parentCreate).toBe(0);
      expect(prisma.calls.userUpdate).toBe(0);
    },
  );
});
