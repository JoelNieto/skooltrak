import { Field, InputType } from '@nestjs/graphql';
import { $Enums, Prisma } from '@prisma/client';

@InputType()
export class CreateAssignmentInput
  implements Prisma.AssignmentUncheckedCreateInput
{
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
export class AssignmentDateInput
  implements Prisma.AssignmentDateUncheckedCreateInput
{
  @Field(() => Date, { description: 'Fecha de la asignacion' })
  date: Date;
  @Field(() => String, { description: 'Id de la asignacion' })
  assignmentId: string;
  @Field(() => String, { description: 'Id del grupo' })
  classGroupId: string;
}
