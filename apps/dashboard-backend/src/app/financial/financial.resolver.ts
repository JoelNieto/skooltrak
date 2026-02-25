import { AuthUserContext, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChargesService } from './charges.service';
import { Charge } from './entities/charge.entity';
import { Payment } from './entities/payment.entity';
import { StudentBalance } from './entities/student-balance.entity';
import { StudentFinancialSummary } from './entities/student-financial-summary.entity';
import { PaymentsService } from './payments.service';
import { StudyPlansService } from '../study-plans/study-plans.service';
import { CreateChargeInput } from './dto/create-charge.input';
import { CreatePaymentInput } from './dto/create-payment.input';
import { UpdateStudyPlanFinancialInput } from './dto/update-study-plan-financial.input';
import { StudyPlan } from '../study-plans/entities/study-plan.entity';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@Resolver()
export class FinancialResolver {
  constructor(
    private readonly chargesService: ChargesService,
    private readonly paymentsService: PaymentsService,
    private readonly studyPlansService: StudyPlansService,
  ) {}

  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @Query(() => StudentBalance, { name: 'studentBalance' })
  getStudentBalance(@Args('studentId', { type: () => String }) studentId: string) {
    return this.paymentsService.getStudentBalance(studentId);
  }

  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @Query(() => [Charge], { name: 'chargesByStudent' })
  getChargesByStudent(@Args('studentId', { type: () => String }) studentId: string) {
    return this.chargesService.findByStudent(studentId);
  }

  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @Query(() => [Payment], { name: 'paymentsByStudent' })
  getPaymentsByStudent(@Args('studentId', { type: () => String }) studentId: string) {
    return this.paymentsService.findByStudent(studentId);
  }

  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @Query(() => [StudentFinancialSummary], { name: 'linkedStudentsFinancialSummary' })
  getLinkedStudentsFinancialSummary(@Context() context: any) {
    const user = context.req?.user as AuthUserContext | undefined;
    if (!user?.userId) return [];
    return this.paymentsService.getLinkedStudentsFinancialSummary(user.userId);
  }

  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @Query(() => [Charge], { name: 'chargesBySchool' })
  getChargesBySchool(
    @Args('schoolId', { type: () => String }) schoolId: string,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
  ) {
    return this.chargesService.findBySchool(schoolId, year);
  }

  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @Mutation(() => [Charge], { name: 'createCharge' })
  createCharge(@Args('input') input: CreateChargeInput) {
    return this.chargesService.create(input);
  }

  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @Mutation(() => Payment, { name: 'createPayment' })
  createPayment(@Args('input') input: CreatePaymentInput) {
    return this.paymentsService.create(input);
  }

  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @Mutation(() => Charge, { name: 'removeCharge', nullable: true })
  removeCharge(@Args('id', { type: () => String }) id: string) {
    return this.chargesService.remove(id);
  }

  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @Mutation(() => StudyPlan, { name: 'updateStudyPlanFinancialConfig' })
  updateStudyPlanFinancialConfig(
    @Args('input') input: UpdateStudyPlanFinancialInput,
  ) {
    return this.studyPlansService.updateFinancialConfig(input);
  }
}
