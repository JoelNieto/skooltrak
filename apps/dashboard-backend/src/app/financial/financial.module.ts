import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudyPlansModule } from '../study-plans/study-plans.module';
import { ChargesService } from './charges.service';
import { FinancialResolver } from './financial.resolver';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, StudyPlansModule],
  providers: [FinancialResolver, ChargesService, PaymentsService],
})
export class FinancialModule {}
