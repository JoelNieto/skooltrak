import { TransformDateToNoon } from '@/shared';
import { Prisma } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';
@InputType()
export class CreateGradeInput implements Prisma.GradeUncheckedCreateInput {
  @Field(() => String, { description: 'Titulo de la calificacion  ' })
  title: string;
  @Field(() => String, { description: 'Comentarios' })
  comments?: string;
  @Field(() => String, { description: 'Id del curso' })
  courseId: string;
  @Field(() => String, { description: 'Id del bucket' })
  bucketId: string;
  @Field(() => String, { description: 'Id del periodo' })
  periodId: string;
  @TransformDateToNoon()
  @Field(() => Date, { description: 'Fecha de la calificacion' })
  date: Date;
  @Field(() => Boolean, { description: '¿Publicada?', defaultValue: false })
  published?: boolean;
}
