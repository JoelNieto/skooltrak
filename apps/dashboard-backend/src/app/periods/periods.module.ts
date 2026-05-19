import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PeriodsController } from './periods.controller';
import { PeriodsService } from './periods.service';

@Module({
  controllers: [PeriodsController],
  providers: [
    PeriodsService,
  ],
  imports: [PrismaModule],
})
export class PeriodsModule {}
