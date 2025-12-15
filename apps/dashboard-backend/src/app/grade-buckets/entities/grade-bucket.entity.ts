import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
@ObjectType()
export class GradeBucket implements Prisma.GradeBucketGetPayload<unknown> {
  @Field(() => String, { description: 'Id del bucket' })
  id: string;
  @Field(() => String, { description: 'Nombre del bucket' })
  name: string;
  @Field(() => Number, { description: 'Peso del bucket' })
  weight: Prisma.Decimal;
  @Field(() => String, { description: 'Id del curso' })
  courseId: string;
  @Field(() => Date, { description: 'Fecha de creación' })
  createdAt: Date;
  @Field(() => Date, { description: 'Fecha de actualización' })
  updatedAt: Date;
}
