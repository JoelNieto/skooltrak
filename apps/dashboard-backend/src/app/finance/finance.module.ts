import { Module } from '@nestjs/common';
import { CLOCK, systemClock } from '../home/home-time';
import { PrismaModule } from '../prisma.module';
import { AccountsService } from './accounts.service';
import { ChargesService } from './charges.service';
import { FinanceController } from './finance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [AccountsService, ChargesService, { provide: CLOCK, useValue: systemClock }],
  exports: [AccountsService],
})
export class FinanceModule {}
