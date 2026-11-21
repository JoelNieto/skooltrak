import { courseAverage } from '@/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { recordRevisions, REASON_REQUIRED, scoreChanged, validReason } from '../grades/grade-revisions';
import { PrismaService } from '../prisma.service';
import { CreateStudentGradeInput } from './dto/create-student-grade.input';
import { UpdateStudentGradeInput } from './dto/update-student-grade.input';

@Injectable()
export class StudentGradesService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * One row per (grade, student) (ASM-001 BR .10): creating an existing cell updates it. On a
   * published grade, a score change needs a reason and writes a revision (BR .8).
   */
  create(createStudentGradeInput: CreateStudentGradeInput, published = false, actorId: string | null = null) {
    const { gradeId, studentId, score, comments, reason } = createStudentGradeInput;
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.studentGrade.findUnique({
        where: { gradeId_studentId: { gradeId, studentId } },
        select: { score: true },
      });
      const next = toScore(score);
      const why = published && scoreChanged(before?.score, next) ? requireReason(reason) : null;
      const row = await tx.studentGrade.upsert({
        where: { gradeId_studentId: { gradeId, studentId } },
        create: { gradeId, studentId, score: next, comments },
        update: { score: next, comments },
      });
      if (why) {
        await recordRevisions(tx, [{ studentGradeId: row.id, previousScore: before?.score ?? null, score: next, reason: why }], actorId);
      }
      return row;
    });
  }

  findByCourseId(courseId: string, periodId?: string, studentId?: string) {
    return this.prisma.studentGrade.findMany({
      where: { grade: { courseId, periodId, published: true }, studentId },
      include: {
        grade: {
          include: {
            period: true,
            bucket: true,
            course: true,
          },
        },
        student: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.studentGrade.findUnique({ where: { id } });
  }

  async getAverageScoreForStudent(
    courseId: string,
    periodId: string,
    studentId: string
  ) {
    const grades = await this.prisma.studentGrade.findMany({
      where: { grade: { courseId, periodId, published: true }, studentId },
      include: {
        grade: {
          include: {
            bucket: true,
          },
        },
      },
    });
    // ASM-001 BR .4; null when the student has no scored grade (never 0).
    return courseAverage(
      grades.map((g) => ({ bucketId: g.grade.bucketId, weight: g.grade.bucket.weight.toNumber(), score: g.score?.toNumber() })),
    );
  }

  /** On a published grade, a score change needs a reason and writes a revision (BR-ASM-001.8). */
  update(id: string, updateStudentGradeInput: UpdateStudentGradeInput, published = false, actorId: string | null = null) {
    const { score, comments, reason } = updateStudentGradeInput;
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.studentGrade.findUniqueOrThrow({ where: { id }, select: { score: true } });
      const changing = score !== undefined && scoreChanged(before.score, toScore(score));
      const why = published && changing ? requireReason(reason) : null;
      const row = await tx.studentGrade.update({
        where: { id },
        data: { ...(score !== undefined ? { score: toScore(score) } : {}), ...(comments !== undefined ? { comments } : {}) },
      });
      if (why) {
        await recordRevisions(tx, [{ studentGradeId: id, previousScore: before.score, score: toScore(score), reason: why }], actorId);
      }
      return row;
    });
  }

  remove(id: string) {
    return this.prisma.studentGrade.delete({ where: { id } });
  }
}

const toScore = (score: number | { toNumber(): number } | null | undefined): number | null =>
  score === null || score === undefined ? null : typeof score === 'number' ? score : score.toNumber();

function requireReason(reason: string | undefined): string {
  const why = validReason(reason);
  if (!why) throw new BadRequestException(REASON_REQUIRED);
  return why;
}
