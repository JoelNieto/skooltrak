import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
@ObjectType()
export class GradeMetric
  implements Prisma.GradeMetricGetPayload<{ include: undefined }>
{
  @Field(() => String, { description: 'ID' })
  id: string;

  @Field(() => String, { description: 'Nombre' })
  name: string;

  @Field(() => Number, { description: 'Minimo' })
  minimum: Prisma.Decimal;

  @Field(() => Number, { description: 'Maximo' })
  maximum: Prisma.Decimal;

  @Field(() => Number, { description: 'Minimo de aprobacion' })
  minimumApproval: Prisma.Decimal;

  @Field(() => Number, { description: 'Minimo de excelencia' })
  minimumExcellence: Prisma.Decimal;

  @Field(() => Date, { description: 'Fecha de creacion' })
  createdAt: Date;

  @Field(() => Date, { description: 'Fecha de actualizacion' })
  updatedAt: Date;
}
