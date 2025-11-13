import { Field, ObjectType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@ObjectType()
export class GradeMetric
  implements Prisma.GradeMetricGetPayload<{ include: undefined }>
{
  @Field(() => String, { description: 'ID del grado' })
  id: string;

  @Field(() => String, { description: 'Nombre del grado' })
  name: string;

  @Field(() => Number, { description: 'Valor mínimo del grado' })
  minimum: Prisma.Decimal;

  @Field(() => Number, { description: 'Valor máximo del grado' })
  maximum: Prisma.Decimal;

  @Field(() => Number, { description: 'Valor mínimo de aprobación del grado' })
  minimumApproval: Prisma.Decimal;

  @Field(() => Number, { description: 'Valor mínimo de excelencia del grado' })
  minimumExcellence: Prisma.Decimal;

  @Field(() => Date, { description: 'Fecha de creación del grado' })
  createdAt: Date;

  @Field(() => Date, { description: 'Fecha de actualización del grado' })
  updatedAt: Date;
}
