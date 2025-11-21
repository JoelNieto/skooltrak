import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradeBucketsResolver } from './grade-buckets.resolver';
import { GradeBucketsService } from './grade-buckets.service';

@Module({
  providers: [GradeBucketsResolver, GradeBucketsService],
  imports: [PrismaModule],
})
export class GradeBucketsModule {}
