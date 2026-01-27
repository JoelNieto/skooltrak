import { Field, ObjectType } from '@nestjs/graphql';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';

@ObjectType()
export class AssignmentDate {
  @Field(() => String, { description: 'ID of the assignment date' })
  id: string;

  @Field(() => Date, { description: 'Due date for this group' })
  date: Date;

  @Field(() => String, { description: 'Assignment ID' })
  assignmentId: string;

  @Field(() => String, { description: 'Class group ID' })
  classGroupId: string;

  @Field(() => ClassGroup, { description: 'Class group', nullable: true })
  classGroup: ClassGroup;
}
