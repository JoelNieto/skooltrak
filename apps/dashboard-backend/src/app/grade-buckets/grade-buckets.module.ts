import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GradeBucketsController } from './grade-buckets.controller';
import { GradeBucketsResolver } from './grade-buckets.resolver';
import { GradeBucketsService } from './grade-buckets.service';

@Module({
  controllers: [GradeBucketsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [GradeBucketsResolver] : []),
    GradeBucketsService,
  ],
  imports: [PrismaModule],
})
export class GradeBucketsModule {}
