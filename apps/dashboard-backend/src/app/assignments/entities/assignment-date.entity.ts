import { ClassGroup } from '../../class-groups/entities/class-group.entity';

export class AssignmentDate {
    id: string;

    date: Date;

    assignmentId: string;

    classGroupId: string;

    classGroup: ClassGroup;
}
