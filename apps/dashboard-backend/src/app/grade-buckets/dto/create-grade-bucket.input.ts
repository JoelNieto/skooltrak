import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreateGradeBucketInput
  implements Prisma.GradeBucketUncheckedCreateInput
{
  @Field(() => String, { description: 'Nombre del bucket' })
  name: string;
  @Field(() => Number, { description: 'Peso del bucket' })
  weight: number | Prisma.Decimal;
  @Field(() => String, { description: 'Id del curso' })
  courseId: string;
}
