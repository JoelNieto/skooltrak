import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssignmentSubmissionsService } from './assignment-submissions.service';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

/** HOM-001-S02 / BR-HOM-001.17 — only the course's teacher (or an admin) marks a submission reviewed. */
describe('AssignmentSubmissionsService.setReviewed (BR-HOM-001.17)', () => {
  const ORG = 'org-1';
  const NOW = new Date('2026-11-16T14:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers({ now: NOW });
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  function build(role: string, submission: unknown) {
    const prisma = {
      assignmentSubmission: {
        findFirst: jest.fn().mockResolvedValue(submission),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'sub-1', ...data })),
      },
    };
    const config = { get: jest.fn().mockReturnValue('test') };
    const request = { user: { userId: 'user-teacher', organizationId: ORG, role } };
    const service = new AssignmentSubmissionsService(prisma as never, config as never, request as never);
    return { service, prisma };
  }

  const ownedBy = (userId: string | null) => ({
    id: 'sub-1',
    assignment: { course: { teacher: userId ? { userId } : null } },
  });

  it("lets the course's teacher mark it reviewed, scoped to the caller's organization", async () => {
    const { service, prisma } = build('TEACHER', ownedBy('user-teacher'));

    await expect(service.setReviewed('sub-1', true)).resolves.toEqual({ id: 'sub-1', reviewedAt: NOW });
    expect(prisma.assignmentSubmission.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub-1', assignment: { course: { organizationId: ORG } } } }),
    );
  });

  it('clears the review', async () => {
    const { service, prisma } = build('TEACHER', ownedBy('user-teacher'));

    await service.setReviewed('sub-1', false);

    expect(prisma.assignmentSubmission.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sub-1' }, data: { reviewedAt: null } }),
    );
  });

  it("refuses another teacher's submission and changes nothing", async () => {
    const { service, prisma } = build('TEACHER', ownedBy('user-other-teacher'));

    await expect(service.setReviewed('sub-1', true)).rejects.toThrow(
      new ForbiddenException('Solo el docente del curso puede revisar esta entrega'),
    );
    expect(prisma.assignmentSubmission.update).not.toHaveBeenCalled();
  });

  it('refuses a course with no teacher for a teacher caller', async () => {
    const { service } = build('TEACHER', ownedBy(null));

    await expect(service.setReviewed('sub-1', true)).rejects.toThrow(ForbiddenException);
  });

  it('lets an org admin review any submission of the organization', async () => {
    const { service } = build('ORG_ADMIN', ownedBy('user-other-teacher'));

    await expect(service.setReviewed('sub-1', true)).resolves.toEqual({ id: 'sub-1', reviewedAt: NOW });
  });

  it('answers 404 for a submission outside the organization', async () => {
    const { service, prisma } = build('ORG_ADMIN', null);

    await expect(service.setReviewed('sub-x', true)).rejects.toThrow(NotFoundException);
    expect(prisma.assignmentSubmission.update).not.toHaveBeenCalled();
  });
});
