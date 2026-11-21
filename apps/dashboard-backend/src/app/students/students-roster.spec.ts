jest.mock('../prisma.service', () => ({ PrismaService: class {} }));
jest.mock('../courses/course-roster', () => ({
  ...jest.requireActual('../courses/course-roster'),
  syncStudentPlan: jest.fn(),
}));

import { syncStudentPlan } from '../courses/course-roster';
import { StudentsService } from './students.service';

/**
 * A class-group change moves the student's plan enrollments (ACA-001 BR .15) in the same
 * transaction as the update. The sync rules themselves are covered in course-roster.spec.ts.
 */
const sync = syncStudentPlan as jest.MockedFunction<typeof syncStudentPlan>;

function setup() {
  const tx = {
    student: {
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
        id: where.id,
        userId: 'u-st',
        schoolId: 'SC1',
        classGroupId: 'classGroupId' in data ? (data['classGroupId'] as string | null) : 'G-OLD',
      })),
    },
  };
  const prisma = {
    $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    classGroup: { findUnique: jest.fn(async () => ({ studyPlanId: 'P2', schoolId: 'SC1', organizationId: 'org-1' })) },
    studentClassGroupHistory: { updateMany: jest.fn(), create: jest.fn() },
  };
  const chatSync = { addUserToClassGroupChats: jest.fn(), addUserToCourseChats: jest.fn() };
  const charges = { generateFromStudyPlan: jest.fn() };
  const request = { user: { userId: 'u-admin', organizationId: 'org-1' } };
  const service = new StudentsService(prisma as never, chatSync as never, {} as never, charges as never, request as never);
  return { service, prisma, tx, chatSync };
}

describe('StudentsService roster sync (ACA-001-S11)', () => {
  beforeEach(() => sync.mockReset().mockResolvedValue(['C1', 'C2']));

  it('moves plan enrollments in the transaction of a class-group change and joins the course chats', async () => {
    const { service, tx, chatSync } = setup();

    await service.update('ST1', { id: 'ST1', classGroupId: 'G-NEW' } as never);

    expect(sync).toHaveBeenCalledWith(tx, 'ST1', 'G-NEW');
    expect(chatSync.addUserToCourseChats.mock.calls.map((c) => c[0])).toEqual(['C1', 'C2']);
  });

  it('removes plan enrollments when the class group is cleared', async () => {
    const { service, tx } = setup();
    sync.mockResolvedValue([]);

    await service.update('ST1', { id: 'ST1', classGroupId: '' } as never);

    expect(sync).toHaveBeenCalledWith(tx, 'ST1', null);
  });

  it('leaves the roster alone when the class group is not part of the update', async () => {
    const { service, chatSync } = setup();

    await service.update('ST1', { id: 'ST1', firstName: 'Ana' } as never);

    expect(sync).not.toHaveBeenCalled();
    expect(chatSync.addUserToCourseChats).not.toHaveBeenCalled();
  });
});
