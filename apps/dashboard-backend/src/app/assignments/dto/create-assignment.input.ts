import { $Enums, Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateAssignmentInput implements Prisma.AssignmentUncheckedCreateInput {
  @Field(() => String, { description: 'Titulo de la asignacion' })
  title: string;
  @Field(() => String, { description: 'Detalles de la asignacion' })
  details: string;
  @Field(() => String, { description: 'Tipo de la asignacion' })
  type: $Enums.AssignmentType;
  @Field(() => String, { description: 'Fecha de la asignacion' })
  date: string | Date;
  @Field(() => String, { description: 'Id de la escuela' })
  schoolId: string;
  @Field(() => String, { description: 'Id del curso' })
  courseId: string;
  @Field(() => Boolean, { description: 'Requiere envio' })
  requireSubmission: boolean;
  @Field(() => String, { description: 'Id del profesor' })
  teacherId: string;

  @Field(() => [AssignmentDateInput], {
    description: 'Fechas de la asignacion',
    nullable: true,
  })
  groupDates?: AssignmentDateInput[];
}

@InputType()
export class AssignmentDateInput {
  @Field(() => Date, { description: 'Due date for this group' })
  date: Date;
  @Field(() => String, { description: 'Class group ID' })
  classGroupId: string;
}
