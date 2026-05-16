import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PeriodsController } from './periods.controller';
import { PeriodsResolver } from './periods.resolver';
import { PeriodsService } from './periods.service';

@Module({
  controllers: [PeriodsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [PeriodsResolver] : []),
    PeriodsService,
  ],
  imports: [PrismaModule],
})
export class PeriodsModule {}
