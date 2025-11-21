import { Field, InputType } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

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
  @Field(() => Date, { description: 'Fecha de la calificacion' })
  date: string | Date;
  @Field(() => Boolean, { description: '¿Publicada?', defaultValue: false })
  published?: boolean;
}
