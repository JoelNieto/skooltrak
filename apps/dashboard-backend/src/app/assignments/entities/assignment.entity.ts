import { $Enums } from '@generated/prisma';
import { Course } from '../../courses/entities/course.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';
import { AssignmentDate } from './assignment-date.entity';

export class Assignment
{
    id: string;
    title: string;
    details: string;
    type: $Enums.AssignmentType;
    date: Date;
    schoolId: string;
    courseId: string;
    course: Course;
    requireSubmission: boolean;
    teacherId: string;
    teacher: Teacher;
    dates: AssignmentDate[];
    createdAt: Date;
    updatedAt: Date;
}
