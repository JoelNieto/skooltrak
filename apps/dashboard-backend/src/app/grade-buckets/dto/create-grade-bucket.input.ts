import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { DecimalJsLike } from '@prisma/client/runtime/library';

@InputType()
export class CreateGradeBucketInput
  implements Prisma.GradeBucketUncheckedCreateInput
{
  @Field(() => String, { description: 'Nombre del bucket' })
  name: string;
  @Field(() => Number, { description: 'Peso del bucket' })
  weight: number | Prisma.Decimal | DecimalJsLike;
  @Field(() => String, { description: 'Id del curso' })
  courseId: string;
}
