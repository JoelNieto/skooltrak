import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGradeBucketInput } from './dto/create-grade-bucket.input';
import { UpdateGradeBucketInput } from './dto/update-grade-bucket.input';

@Injectable()
export class GradeBucketsService {
  constructor(private readonly prisma: PrismaService) {}
  create(createGradeBucketInput: CreateGradeBucketInput) {
    return this.prisma.gradeBucket.create({ data: createGradeBucketInput });
  }

  findManyByCourseId(courseId: string) {
    return this.prisma.gradeBucket.findMany({ where: { courseId } });
  }

  findOne(id: string) {
    return this.prisma.gradeBucket.findUnique({ where: { id } });
  }

  update(id: string, updateGradeBucketInput: UpdateGradeBucketInput) {
    return this.prisma.gradeBucket.update({
      where: { id },
      data: updateGradeBucketInput,
    });
  }

  remove(id: string) {
    return this.prisma.gradeBucket.delete({ where: { id } });
  }
}
