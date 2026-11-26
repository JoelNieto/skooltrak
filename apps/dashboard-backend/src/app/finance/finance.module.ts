import { Module } from '@nestjs/common';
import { CLOCK, systemClock } from '../home/home-time';
import { PrismaModule } from '../prisma.module';
import { AccountsService } from './accounts.service';
import { ChargesService } from './charges.service';
import { FeesService } from './fees.service';
import { FinanceController } from './finance.controller';
import { GenerationService } from './generation.service';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [AccountsService, ChargesService, FeesService, GenerationService, PaymentsService, { provide: CLOCK, useValue: systemClock }],
  exports: [AccountsService],
})
export class FinanceModule {}
