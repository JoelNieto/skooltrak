import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudyPlansModule } from '../study-plans/study-plans.module';
import { ChargesService } from './charges.service';
import { FinancialController } from './financial.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [FinancialController],
  imports: [PrismaModule, StudyPlansModule],
  providers: [
    ChargesService,
    PaymentsService,
  ],
})
export class FinancialModule {}
