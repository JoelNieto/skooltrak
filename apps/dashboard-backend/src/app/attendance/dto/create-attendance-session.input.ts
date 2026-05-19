import { TransformDateToNoon } from '@/shared';
import { CreateAttendanceRecordInput } from './create-attendance-record.input';

export class CreateAttendanceSessionInput {
  @TransformDateToNoon()
    date: Date;

    courseId: string;

    classGroupId: string;

    records: CreateAttendanceRecordInput[];
}
