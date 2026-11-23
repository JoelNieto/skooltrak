import { ConflictException, ForbiddenException } from '@nestjs/common';

// The `@/auth` barrel pulls in better-auth's ESM build, which this Jest setup can't parse. Serve
// the guards, decorators and Perm enum from source, plus the two helpers the service imports.
jest.mock('@thallesp/nestjs-better-auth', () => ({ Session: () => () => undefined }));
jest.mock('../../../../../libs/auth/src/lib/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@/auth', () => ({
  ...jest.requireActual('../../../../../libs/auth/src/lib/auth.guard'),
  ...jest.requireActual('../../../../../libs/auth/src/lib/permissions/permissions.constants'),
  OnboardingStep: { COMPLETED: 'COMPLETED' },
  sendUserInvitation: jest.fn(),
}));
jest.mock('@/api-contracts', () => ({ FetchDataQueryDto: class {}, PaginatedResponseDto: class {} }));

import { TEACHER_PERSONAL_DETAILS } from '../prisma.service';
import { TEACHER_DENIED, TeachersController } from './teachers.controller';
import { EMAIL_IN_OTHER_ORGANIZATION, TeachersService } from './teachers.service';

/**
 * The teachers API stays in the caller's organization, never takes over another organization's
 * account, and returns personal details only on the teacher's profile.
 */
const teachers = [
  { id: 'T1', organizationId: 'org-1' },
  { id: 'T9', organizationId: 'org-2' },
];
const prisma = {
  teacher: {
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => teachers.find((t) => t.id === where.id) ?? null),
  },
};
const user = (role: string, organizationId = 'org-1') => ({ user: { userId: 'u', role, organizationId } }) as never;
const admin = user('ORG_ADMIN');

function controller() {
  const service = {
    create: jest.fn(async (input: object) => ({ ...input, firstName: 'A', fatherName: 'B' })),
    findManyByOrganizationId: jest.fn(async () => []),
    findOne: jest.fn(async () => ({ id: 'T1', firstName: 'A', fatherName: 'B' })),
    update: jest.fn(async () => ({ id: 'T1', firstName: 'A', fatherName: 'B' })),
    remove: jest.fn(async () => ({})),
  };
  return { service, controller: new TeachersController(service as never, prisma as never) };
}

describe('Teacher access', () => {
  it("reads and writes only the caller's organization's teachers", async () => {
    const { service, controller: c } = controller();
    await c.findOne(admin, 'T1');
    await c.update(admin, { id: 'T1' } as never);
    await c.remove(admin, 'T1');
    expect(service.findOne).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.remove).toHaveBeenCalledTimes(1);

    await expect(c.findOne(user('TEACHER'), 'T9')).rejects.toThrow(new ForbiddenException(TEACHER_DENIED));
    await expect(c.update(admin, { id: 'T9' } as never)).rejects.toThrow(ForbiddenException);
    await expect(c.remove(admin, 'T9')).rejects.toThrow(ForbiddenException);
    await expect(c.findManyByOrganizationId(admin, 'org-2')).rejects.toThrow(ForbiddenException);
  });

  it("creates teachers in the caller's organization", async () => {
    const { service, controller: c } = controller();
    await c.create(admin, { email: 'a@b.c', organizationId: 'org-2' } as never);
    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-1' }));
  });

  it("refuses an email that belongs to another organization's account", async () => {
    const db = {
      role: { findFirstOrThrow: jest.fn(async () => ({ id: 'role-teacher' })) },
      organization: { findUnique: jest.fn(async () => ({ name: 'Org 1' })) },
      user: {
        findUnique: jest.fn(async () => ({ id: 'u9', organizationId: 'org-2', teacher: null })),
        update: jest.fn(),
      },
    };
    const service = new TeachersService(db as never, {} as never);
    await expect(service.create({ email: 'admin@org2.test', organizationId: 'org-1' } as never)).rejects.toThrow(
      new ConflictException(EMAIL_IN_OTHER_ORGANIZATION),
    );
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("brings personal details back only on the teacher's profile", async () => {
    const findUnique = jest.fn(async () => null);
    const service = new TeachersService({ teacher: { findUnique } } as never, {} as never);
    await service.findOne('T1');
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ omit: TEACHER_PERSONAL_DETAILS }));
  });
});
