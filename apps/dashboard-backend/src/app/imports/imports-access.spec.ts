jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { IMPORT_DENIED, ImportService } from './imports.service';

/**
 * Imports run in the caller's organization: the dry-run takes it from the session (never the
 * body) and checks the school belongs to it; a job of another organization reads as missing.
 */
function setup() {
  const prisma = {
    school: {
      findFirst: jest.fn(async ({ where }: { where: { id: string; organizationId: string } }) =>
        where.id === 'SC1' && where.organizationId === 'org-1' ? { id: 'SC1' } : null,
      ),
    },
    student: { findMany: jest.fn(async () => []) },
    teacher: { findMany: jest.fn(async () => []) },
    importJob: {
      findUnique: jest.fn(async () => ({ id: 'J1', organizationId: 'org-1', status: 'DRY_RUN', errors: [] })),
      findFirst: jest.fn(async ({ where }: { where: { id: string; organizationId: string } }) =>
        where.organizationId === 'org-1' ? { id: 'J1', organizationId: 'org-1' } : null,
      ),
      update: jest.fn(),
    },
  };
  const service = new ImportService(prisma as never);
  return { service, prisma };
}

const req = (organizationId: string | null) => ({ user: { userId: 'u-admin', organizationId } });

describe('imports are scoped to the caller organization', () => {
  it("refuses a school outside the caller's organization before reading anything", async () => {
    const { service, prisma } = setup();
    await expect(service.dryRun('org-2', 'SC1', 'STUDENT' as never, 'a,b\n1,2', 'u-admin')).rejects.toEqual(
      expect.objectContaining({ message: IMPORT_DENIED }),
    );
    expect(prisma.student.findMany).not.toHaveBeenCalled();
  });

  it("uses the session's organization, not the body's", async () => {
    const service = { dryRun: jest.fn(), commit: jest.fn(), getJob: jest.fn() };
    const controller = new ImportsController(service as never);
    await controller.dryRun(req('org-1'), { organizationId: 'org-2', schoolId: 'SC1', entityType: 'STUDENT', csvText: '' });
    expect(service.dryRun).toHaveBeenCalledWith('org-1', 'SC1', 'STUDENT', '', 'u-admin');

    await controller.commit(req('org-1'), 'J1');
    expect(service.commit).toHaveBeenCalledWith('J1', 'u-admin', 'org-1');
  });

  it('refuses a caller without an organization', async () => {
    const controller = new ImportsController({} as never);
    await expect(controller.dryRun(req(null), { schoolId: 'SC1' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.getJob(req(null), 'J1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("reports another organization's job as missing", async () => {
    const { service, prisma } = setup();
    await expect(service.commit('J1', 'u-admin', 'org-2')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getJob('J1', 'org-2')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.importJob.update).not.toHaveBeenCalled();
  });

  it('returns a job of the own organization', async () => {
    const { service } = setup();
    await expect(service.getJob('J1', 'org-1')).resolves.toMatchObject({ id: 'J1' });
  });
});
