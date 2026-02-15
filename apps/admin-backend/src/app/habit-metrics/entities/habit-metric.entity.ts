import { Prisma } from '@generated/prisma';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class HabitMetric
  implements Prisma.HabitMetricGetPayload<{ include: undefined }>
{
  @Field(() => String, { description: 'ID del criterio' })
  id: string;

  @Field(() => String, { description: 'Nombre del criterio' })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Descripción del criterio',
  })
  description: string | null;

  @Field(() => Boolean, { description: 'Estado activo del criterio' })
  active: boolean;

  @Field(() => Int, { description: 'Orden de visualización' })
  order: number;

  @Field(() => Date, { description: 'Fecha de creación' })
  createdAt: Date;

  @Field(() => Date, { description: 'Fecha de actualización' })
  updatedAt: Date;
}
