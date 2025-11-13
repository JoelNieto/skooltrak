import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@InputType()
export class CreateGradeMetricInput
  implements Prisma.GradeMetricUncheckedCreateInput
{
  @Field(() => String, { description: 'Nombre del grado' })
  name: string;

  @Field(() => Number, { description: 'Valor mínimo del grado' })
  minimum: number;

  @Field(() => Number, { description: 'Valor máximo del grado' })
  maximum: number;

  @Field(() => Number, { description: 'Valor mínimo de aprobación del grado' })
  minimumApproval: number;

  @Field(() => Number, { description: 'Valor mínimo de excelencia del grado' })
  minimumExcellence: number;
}
