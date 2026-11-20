import { Module } from '@nestjs/common';
import { GradesModule } from '../grades/grades.module';
import { PrismaModule } from '../prisma.module';
import { GradeBucketsController } from './grade-buckets.controller';
import { GradeBucketsService } from './grade-buckets.service';

@Module({
  controllers: [GradeBucketsController],
  providers: [
    GradeBucketsService,
  ],
  imports: [PrismaModule, GradesModule],
})
export class GradeBucketsModule {}
