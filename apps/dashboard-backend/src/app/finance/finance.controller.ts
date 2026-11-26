import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PaymentMethod } from '@generated/prisma';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { AccountsService } from './accounts.service';
import { ChargesService } from './charges.service';
import { CreateChargeInput, CreateChargeResult } from './dto/create-charge.input';
import { CreateFeeAssignmentInput, CreateFeeItemInput, GenerateChargesInput, UpdateFeeItemInput } from './dto/fees.input';
import { RegisterPaymentInput } from './dto/payments.input';
import { FinancePaymentList, PaymentReceipt } from './entities/payments.entity';
import { FinanceAccountDetail, FinanceAccountList, FinanceStudentHit } from './entities/finance.entity';
import {
  FeeAssignmentView,
  FeeItemList,
  FeeItemView,
  FeeTargets,
  GenerationPreview,
  GenerationResult,
} from './entities/fees.entity';
import { assertFinanceStaffOfSchool } from './finance-access';
import { FeesService } from './fees.service';
import { GenerationService } from './generation.service';
import { PaymentsService } from './payments.service';

/**
 * Family accounts and charges (FIN-001). Staff routes are scoped to a school of the caller's
 * organization; guardians reach only accounts holding one of their linked children.
 */
@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@Controller('v1/finance')
export class FinanceController {
  constructor(
    private readonly accounts: AccountsService,
    private readonly charges: ChargesService,
    private readonly fees: FeesService,
    private readonly generation: GenerationService,
    private readonly payments: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('accounts')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Family accounts of a school (FR-FIN-001.2)' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'overdue', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async listAccounts(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('q') q?: string,
    @Query('overdue') overdue?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ): Promise<FinanceAccountList> {
    await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId);
    return this.accounts.list(schoolId, {
      q,
      overdue: overdue === 'true',
      page: page ? Number(page) || 1 : 1,
      take: take ? Number(take) || undefined : undefined,
    });
  }

  @Get('accounts/:id')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Family account with its charges (FR-FIN-001.3, .12)' })
  account(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<FinanceAccountDetail> {
    return this.accounts.detail(req.user, id);
  }

  @Get('me/accounts')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: "The caller's family accounts, one per school of a linked child (FR-FIN-001.12)" })
  myAccounts(@Req() req: AuthenticatedRequest): Promise<FinanceAccountDetail[]> {
    return this.accounts.mine(req.user);
  }

  @Post('charges')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Manual charge for a student or a class group (FR-FIN-001.7)' })
  async createCharge(@Req() req: AuthenticatedRequest, @Body() input: CreateChargeInput): Promise<CreateChargeResult> {
    const organizationId = await assertFinanceStaffOfSchool(this.prisma, req.user, input.schoolId, true);
    return this.charges.createManual(req.user, organizationId, input);
  }

  @Get('students')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Active students of a school by name or cédula, for charge and generation pickers' })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async students(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('search') search = '',
    @Query('take') take?: string,
  ): Promise<FinanceStudentHit[]> {
    await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId, true);
    return this.charges.searchStudents(schoolId, search, take ? Number(take) || 10 : 10);
  }

  // Fee catalog (FR-FIN-001.4)

  @Get('fee-items')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: "The school's fee catalog (FR-FIN-001.4)" })
  async feeItems(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<FeeItemList> {
    await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId, true);
    return this.fees.listItems(schoolId);
  }

  @Post('fee-items')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Create a fee item (FR-FIN-001.4)' })
  async createFeeItem(@Req() req: AuthenticatedRequest, @Body() input: CreateFeeItemInput): Promise<FeeItemView> {
    const organizationId = await assertFinanceStaffOfSchool(this.prisma, req.user, input.schoolId, true);
    return this.fees.createItem(req.user, organizationId, input);
  }

  @Patch('fee-items/:id')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Edit or deactivate a fee item; generated charges are not changed (FR-FIN-001.4)' })
  async updateFeeItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() input: UpdateFeeItemInput): Promise<FeeItemView> {
    const organizationId = await assertFinanceStaffOfSchool(this.prisma, req.user, await this.fees.itemSchool(id), true);
    return this.fees.updateItem(req.user, organizationId, id, input);
  }

  // Assignments (FR-FIN-001.5)

  @Get('fee-targets')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Degrees, study plans and class groups of the school, for fee assignment and generation' })
  async feeTargets(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string): Promise<FeeTargets> {
    await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId, true);
    return this.fees.targets(schoolId);
  }

  @Get('fee-assignments')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Fee assignments of a school for a year (FR-FIN-001.5)' })
  async feeAssignments(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<FeeAssignmentView[]> {
    await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId, true);
    return this.fees.listAssignments(schoolId, year);
  }

  @Post('fee-assignments')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Assign a fee item to a degree or a study plan for a year (FR-FIN-001.5)' })
  async createFeeAssignment(@Req() req: AuthenticatedRequest, @Body() input: CreateFeeAssignmentInput): Promise<FeeAssignmentView> {
    const schoolId = await this.fees.itemSchool(input.feeItemId);
    const organizationId = await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId, true);
    return this.fees.createAssignment(req.user, organizationId, schoolId, input);
  }

  @Delete('fee-assignments/:id')
  @HttpCode(204)
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Remove a fee assignment; charges already generated stay (FR-FIN-001.5)' })
  async deleteFeeAssignment(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
    const schoolId = await this.fees.assignmentSchool(id);
    const organizationId = await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId, true);
    await this.fees.deleteAssignment(req.user, organizationId, schoolId, id);
  }

  // Generation (FR-FIN-001.6)

  @Post('charges/generate/preview')
  @HttpCode(200)
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Preview the charges a generation would create (FR-FIN-001.6)' })
  async previewGeneration(@Req() req: AuthenticatedRequest, @Body() input: GenerateChargesInput): Promise<GenerationPreview> {
    await assertFinanceStaffOfSchool(this.prisma, req.user, input.schoolId, true);
    return this.generation.preview(input);
  }

  @Post('charges/generate')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Generate the missing charges of a year for a study plan, group or student (FR-FIN-001.6)' })
  async generateCharges(@Req() req: AuthenticatedRequest, @Body() input: GenerateChargesInput): Promise<GenerationResult> {
    const organizationId = await assertFinanceStaffOfSchool(this.prisma, req.user, input.schoolId, true);
    return this.generation.generate(req.user, organizationId, input);
  }

  // Payments (FR-FIN-001.14, .15)

  @Post('payments')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Register a transfer/ACH or Yappy payment on a family account (FR-FIN-001.14)' })
  async registerPayment(@Req() req: AuthenticatedRequest, @Body() input: RegisterPaymentInput): Promise<PaymentReceipt> {
    const schoolId = await this.payments.accountSchool(input.accountId);
    const organizationId = await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId, true);
    return this.payments.register(req.user, organizationId, input);
  }

  @Get('payments')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Payments of a school (FR-FIN-001.15)' })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async listPayments(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('method') method?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ): Promise<FinancePaymentList> {
    await assertFinanceStaffOfSchool(this.prisma, req.user, schoolId);
    return this.payments.list(schoolId, {
      method: method && method in PaymentMethod ? (method as PaymentMethod) : undefined,
      from,
      to,
      page: page ? Number(page) || 1 : 1,
      take: take ? Number(take) || undefined : undefined,
    });
  }

  @Get('payments/:id/receipt')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: "A payment's receipt: staff of the organization or guardians of the account (FR-FIN-001.15)" })
  receipt(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<PaymentReceipt> {
    return this.payments.receipt(req.user, id);
  }
}
