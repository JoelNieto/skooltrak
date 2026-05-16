import {
  AuthUserContext,
  AuthenticatedRequest,
  BetterAuthGuard,
  Perm,
  PermissionsGuard,
  RequirePermissions,
} from '@/auth';
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StudyPlansService } from '../study-plans/study-plans.service';
import { ChargesService } from './charges.service';
import { CreateChargeInput } from './dto/create-charge.input';
import { CreatePaymentInput } from './dto/create-payment.input';
import { UpdateStudyPlanFinancialInput } from './dto/update-study-plan-financial.input';
import { PaymentsService } from './payments.service';
@ApiTags('financial')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@Controller('v1/financial')
export class FinancialController {
  constructor(
    private readonly chargesService: ChargesService,
    private readonly paymentsService: PaymentsService,
    private readonly studyPlansService: StudyPlansService,
  ) {}

  @Get('student-balance')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Student balance' })
  getStudentBalance(@Query('studentId') studentId: string) {
    return this.paymentsService.getStudentBalance(studentId);
  }

  @Get('charges/by-student')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Charges by student' })
  getChargesByStudent(@Query('studentId') studentId: string) {
    return this.chargesService.findByStudent(studentId);
  }

  @Get('payments/by-student')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Payments by student' })
  getPaymentsByStudent(@Query('studentId') studentId: string) {
    return this.paymentsService.findByStudent(studentId);
  }

  @Get('linked-students-summary')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Linked students financial summary (parent)' })
  getLinkedStudentsFinancialSummary(@Req() req: AuthenticatedRequest) {
    const user = req.user as AuthUserContext | undefined;
    if (!user?.userId) return [];
    return this.paymentsService.getLinkedStudentsFinancialSummary(user.userId);
  }

  @Get('charges/by-school')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Charges by school' })
  getChargesBySchool(@Query('schoolId') schoolId: string, @Query('year') year?: string) {
    return this.chargesService.findBySchool(schoolId, year != null ? Number(year) : undefined);
  }

  @Post('charges')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Create charges' })
  createCharge(@Body() input: CreateChargeInput) {
    return this.chargesService.create(input);
  }

  @Post('payments')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Create payment' })
  createPayment(@Body() input: CreatePaymentInput) {
    return this.paymentsService.create(input);
  }

  @Delete('charges/:id')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Remove charge' })
  removeCharge(@Param('id') id: string) {
    return this.chargesService.remove(id);
  }

  @Post('study-plan-config')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Update study plan financial config' })
  updateStudyPlanFinancialConfig(@Body() input: UpdateStudyPlanFinancialInput) {
    return this.studyPlansService.updateFinancialConfig(input);
  }
}
