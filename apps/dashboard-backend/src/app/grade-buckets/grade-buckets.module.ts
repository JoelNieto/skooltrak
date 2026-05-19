import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradeBucketsController } from './grade-buckets.controller';
import { GradeBucketsService } from './grade-buckets.service';

@Module({
  controllers: [GradeBucketsController],
  providers: [
    GradeBucketsService,
  ],
  imports: [PrismaModule],
})
export class GradeBucketsModule {}
