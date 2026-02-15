import { Prisma } from '@generated/prisma';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateHabitMetricInput
  implements Prisma.HabitMetricUncheckedCreateInput
{
  @Field(() => String, { description: 'Nombre del criterio' })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Descripción del criterio',
  })
  description?: string;

  @Field(() => Boolean, {
    defaultValue: true,
    description: 'Estado activo del criterio',
  })
  active?: boolean;

  @Field(() => Int, { defaultValue: 0, description: 'Orden de visualización' })
  order?: number;
}
