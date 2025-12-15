import { Prisma } from '@generated/prisma';
import { Field, ObjectType } from '@nestjs/graphql';
import { Course } from '../../courses/entities/course.entity';
import { GradeBucket } from '../../grade-buckets/entities/grade-bucket.entity';
import { GradeStudent } from '../../grade-students/entities/grade-student.entity';
import { Period } from '../../periods/entities/period.entity';
@ObjectType()
export class Grade
  implements
    Prisma.GradeGetPayload<{
      include: {
        period: true;
        bucket: true;
        course: true;
        gradeStudents: true;
      };
    }>
{
  @Field(() => String, { description: 'ID de la calificacion' })
  id: string;
  @Field(() => String, { description: 'Titulo de la calificacion' })
  title: string;
  @Field(() => String, { description: 'Comentarios de la calificacion' })
  comments: string;
  @Field(() => String, { description: 'ID del curso' })
  courseId: string;
  @Field(() => String, { description: 'ID del bucket' })
  bucketId: string;
  @Field(() => String, { description: 'ID del periodo' })
  periodId: string;
  @Field(() => Date, { description: 'Fecha de la calificacion' })
  date: Date;
  @Field(() => Boolean, { description: '¿Publicada?' })
  published: boolean;
  @Field(() => Date, { description: 'Fecha de creacion' })
  createdAt: Date;
  @Field(() => Date, { description: 'Fecha de actualizacion' })
  updatedAt: Date;

  @Field(() => Period, { description: 'Periodo de la calificacion' })
  period: Period;

  @Field(() => GradeBucket, { description: 'Bucket de la calificacion' })
  bucket: GradeBucket;

  @Field(() => Course, { description: 'Curso de la calificacion' })
  course: Course;

  @Field(() => [GradeStudent], {
    description: 'Estudiantes de la calificacion',
  })
  gradeStudents: GradeStudent[];
}
