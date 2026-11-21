import { TransformDateToNoon } from '@/shared';
import { Prisma } from '@generated/prisma';
export class CreateGradeInput implements Prisma.GradeUncheckedCreateInput {
    title: string;
    comments?: string;
    courseId: string;
    bucketId: string;
    periodId: string;
  @TransformDateToNoon()
    date: Date;
    published?: boolean;
    /** Links the column to an assignment of the course (BR-ASM-001.11); null unlinks it. */
    assignmentId?: string | null;
}
