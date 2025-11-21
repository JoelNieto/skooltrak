import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PeriodsResolver } from './periods.resolver';
import { PeriodsService } from './periods.service';

@Module({
  providers: [PeriodsResolver, PeriodsService],
  imports: [PrismaModule],
})
export class PeriodsModule {}
