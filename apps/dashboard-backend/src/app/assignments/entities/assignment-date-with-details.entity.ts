import { $Enums } from '@generated/prisma';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

export class AssignmentDetails {
    id: string;

    title: string;

    details: string;

    type: $Enums.AssignmentType;

    requireSubmission: boolean;

    course: Course;

    teacher: Teacher;
}

export class AssignmentDateWithDetails {
    id: string;

    date: Date;

    assignmentId: string;

    classGroupId: string;

    classGroup: ClassGroup;

    assignment: AssignmentDetails;
}
