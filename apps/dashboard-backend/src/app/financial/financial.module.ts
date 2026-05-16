import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { StudyPlansModule } from '../study-plans/study-plans.module';
import { ChargesService } from './charges.service';
import { FinancialController } from './financial.controller';
import { FinancialResolver } from './financial.resolver';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [FinancialController],
  imports: [PrismaModule, StudyPlansModule],
  providers: [
    ...(includeNestGraphQlResolvers ? [FinancialResolver] : []),
    ChargesService,
    PaymentsService,
  ],
})
export class FinancialModule {}
