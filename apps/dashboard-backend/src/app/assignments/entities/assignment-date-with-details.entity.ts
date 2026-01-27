import { $Enums } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { Teacher } from '../../teachers/entities/teacher.entity';

@ObjectType()
export class AssignmentDetails {
  @Field(() => String, { description: 'ID of the assignment' })
  id: string;

  @Field(() => String, { description: 'Title of the assignment' })
  title: string;

  @Field(() => String, { description: 'Details of the assignment' })
  details: string;

  @Field(() => String, { description: 'Type of the assignment' })
  type: $Enums.AssignmentType;

  @Field(() => Boolean, { description: 'Require submission' })
  requireSubmission: boolean;

  @Field(() => Course, { description: 'Course of the assignment' })
  course: Course;

  @Field(() => Teacher, { description: 'Teacher of the assignment' })
  teacher: Teacher;
}

@ObjectType()
export class AssignmentDateWithDetails {
  @Field(() => String, { description: 'ID of the assignment date' })
  id: string;

  @Field(() => Date, { description: 'Due date for this group' })
  date: Date;

  @Field(() => String, { description: 'Assignment ID' })
  assignmentId: string;

  @Field(() => String, { description: 'Class group ID' })
  classGroupId: string;

  @Field(() => ClassGroup, { description: 'Class group' })
  classGroup: ClassGroup;

  @Field(() => AssignmentDetails, { description: 'Assignment details' })
  assignment: AssignmentDetails;
}
