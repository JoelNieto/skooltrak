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
}
