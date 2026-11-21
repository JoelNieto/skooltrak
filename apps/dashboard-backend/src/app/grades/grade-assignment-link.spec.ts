import { BadRequestException, ConflictException } from '@nestjs/common';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

import { ASSIGNMENT_MISMATCH, ASSIGNMENT_TAKEN, GradeAccessService } from './grade-access.service';

/** ASM-001-S06 — which assignment a grade column may be linked to (BR-ASM-001.11). */
describe('GradeAccessService.assertAssignmentLinkable', () => {
  const date = new Date('2026-11-20T12:00:00Z');
  const assignments: Record<string, { courseId: string; title: string; date: Date; grade: { id: string } | null }> = {
    'A-free': { courseId: 'C1', title: 'Proyecto', date, grade: null },
    'A-linked': { courseId: 'C1', title: 'Ensayo', date, grade: { id: 'G1' } },
    'A-other': { courseId: 'C2', title: 'Tarea 8°', date, grade: null },
  };
  const access = new GradeAccessService({
    assignment: { findUnique: jest.fn(async ({ where }) => assignments[where.id] ?? null) },
  } as never);

  it("returns the assignment's title and date for the column @FR-ASM-001.11", async () => {
    await expect(access.assertAssignmentLinkable('A-free', 'C1')).resolves.toEqual({ title: 'Proyecto', date });
  });

  it('refuses an assignment of another course, or a missing one (400)', async () => {
    await expect(access.assertAssignmentLinkable('A-other', 'C1')).rejects.toThrow(new BadRequestException(ASSIGNMENT_MISMATCH));
    await expect(access.assertAssignmentLinkable('A-none', 'C1')).rejects.toThrow(new BadRequestException(ASSIGNMENT_MISMATCH));
  });

  it('refuses an assignment another column is linked to (409), but not the same column', async () => {
    await expect(access.assertAssignmentLinkable('A-linked', 'C1')).rejects.toThrow(new ConflictException(ASSIGNMENT_TAKEN));
    await expect(access.assertAssignmentLinkable('A-linked', 'C1', 'G1')).resolves.toMatchObject({ title: 'Ensayo' });
  });
});
