import {
  AuthUserContext,
  AuthenticatedRequest,
  BetterAuthGuard,
  Perm,
  PermissionsGuard,
  RequirePermissions,
} from '@/auth';
import { BadRequestException, ForbiddenException, NotFoundException, UseGuards } from '@nestjs/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertSchoolInOrganization, requireOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { StudyPlansService } from '../study-plans/study-plans.service';
import { ChargesService } from './charges.service';
import { CreateChargeInput } from './dto/create-charge.input';
import { CreatePaymentInput } from './dto/create-payment.input';
import { RegenerateStudyPlanChargesInput } from './dto/regenerate-study-plan-charges.input';
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
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Authorizes viewing a student's financials: finance staff of the student's organization; the
   * student themselves; a parent of the student (any organization, BR-HOM-001.9). Throws otherwise.
   */
  private async assertCanViewStudentFinancials(
    req: AuthenticatedRequest,
    studentId: string,
  ) {
    const user = req.user as AuthUserContext | undefined;
    if (!user?.userId) {
      throw new ForbiddenException('No autenticado');
    }
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { organizationId: true, userId: true, parents: { select: { userId: true } } },
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    if (isFinanceStaff(user) && student.organizationId === user.organizationId) {
      return;
    }
    const isOwner = student.userId === user.userId;
    const isParent = (student.parents ?? []).some((p) => p.userId === user.userId);
    if (!isOwner && !isParent) {
      throw new ForbiddenException('No tienes acceso a este estado de cuenta');
    }
  }

  @Get('student-balance-summary')
  @ApiOperation({ summary: 'Student balance breakdown (overdue/active/paid)' })
  async getStudentBalanceSummary(
    @Req() req: AuthenticatedRequest,
    @Query('studentId') studentId: string,
  ) {
    await this.assertCanViewStudentFinancials(req, studentId);
    return this.paymentsService.getStudentBalanceSummary(studentId);
  }

  @Get('student-balance')
  @ApiOperation({ summary: 'Student balance' })
  async getStudentBalance(
    @Req() req: AuthenticatedRequest,
    @Query('studentId') studentId: string,
  ) {
    await this.assertCanViewStudentFinancials(req, studentId);
    return this.paymentsService.getStudentBalance(studentId);
  }

  @Get('charges/by-student')
  @ApiOperation({ summary: 'Charges by student' })
  async getChargesByStudent(
    @Req() req: AuthenticatedRequest,
    @Query('studentId') studentId: string,
  ) {
    await this.assertCanViewStudentFinancials(req, studentId);
    return this.chargesService.findByStudent(studentId);
  }

  @Get('payments/by-student')
  @ApiOperation({ summary: 'Payments by student' })
  async getPaymentsByStudent(
    @Req() req: AuthenticatedRequest,
    @Query('studentId') studentId: string,
  ) {
    await this.assertCanViewStudentFinancials(req, studentId);
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
  @ApiOperation({ summary: 'Charges by school (filtered + paginated)' })
  async getChargesBySchool(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('chargeType') chargeType?: string,
    @Query('studentId') studentId?: string,
    @Query('description') description?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    await this.assertFinanceStaffOfSchool(req.user, schoolId);
    return this.chargesService.findBySchool({
      schoolId,
      year: year != null ? Number(year) : undefined,
      status,
      chargeType,
      studentId,
      description,
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
    });
  }

  @Get('payments/by-school')
  @RequirePermissions(Perm.VIEW_FINANCIALS)
  @ApiOperation({ summary: 'Payments by school (filtered + paginated)' })
  async getPaymentsBySchool(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('year') year?: string,
    @Query('studentId') studentId?: string,
    @Query('reference') reference?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    await this.assertFinanceStaffOfSchool(req.user, schoolId);
    return this.paymentsService.findBySchool({
      schoolId,
      year: year != null ? Number(year) : undefined,
      studentId,
      reference,
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
    });
  }

  @Get('charges/student')
  @ApiOperation({ summary: 'Charges for the current student (filtered + paginated)' })
  async getChargesForStudent(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('chargeType') chargeType?: string,
    @Query('description') description?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const studentId = await this.resolveOwnStudentId(req);
    return this.chargesService.findByStudentScoped(studentId, {
      year: year != null ? Number(year) : undefined,
      status,
      chargeType,
      description,
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
    });
  }

  @Get('payments/student')
  @ApiOperation({ summary: 'Payments for the current student (filtered + paginated)' })
  async getPaymentsForStudent(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
    @Query('reference') reference?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const studentId = await this.resolveOwnStudentId(req);
    return this.paymentsService.findByStudentScoped(studentId, {
      year: year != null ? Number(year) : undefined,
      reference,
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
    });
  }

  /**
   * Resolves the calling user's own student id. Only STUDENT roles may call the
   * student-scoped endpoints; the id is taken from the user's student profile so a
   * client-supplied studentId is never trusted.
   */
  private async resolveOwnStudentId(req: AuthenticatedRequest): Promise<string> {
    const user = req.user as AuthUserContext | undefined;
    if (!user?.userId) {
      throw new ForbiddenException('No autenticado');
    }
    if (user.role?.toUpperCase() !== 'STUDENT') {
      throw new ForbiddenException('No autorizado');
    }
    const student = await this.prisma.student.findFirst({
      where: { userId: user.userId },
      select: { id: true, schoolId: true },
    });
    if (!student) {
      throw new ForbiddenException('No tienes un perfil de estudiante');
    }
    return student.id;
  }

  @Post('charges')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Create charges' })
  async createCharge(@Req() req: AuthenticatedRequest, @Body() input: CreateChargeInput) {
    await this.assertFinanceStaffOfSchool(req.user, input.schoolId);
    if (input.studentId) {
      const found = await this.prisma.student.count({ where: { id: input.studentId, schoolId: input.schoolId } });
      if (!found) throw new BadRequestException(STUDENT_MISMATCH);
    }
    if (input.studyPlanId) {
      const found = await this.prisma.studyPlan.count({ where: { id: input.studyPlanId, schoolId: input.schoolId } });
      if (!found) throw new BadRequestException(PLAN_MISMATCH);
    }
    return this.chargesService.create(input);
  }

  @Post('payments')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Create payment' })
  async createPayment(@Req() req: AuthenticatedRequest, @Body() input: CreatePaymentInput) {
    await this.assertFinanceStaffOfStudent(req.user, input.studentId);
    if (input.chargeId) {
      const found = await this.prisma.charge.count({ where: { id: input.chargeId, studentId: input.studentId } });
      if (!found) throw new BadRequestException(CHARGE_MISMATCH);
    }
    // Who recorded it comes from the session, never from the request.
    return this.paymentsService.create({ ...input, createdBy: req.user?.userId });
  }

  @Delete('charges/:id')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Remove charge' })
  async removeCharge(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const charge = await this.prisma.charge.findUnique({ where: { id }, select: { id: true, schoolId: true } });
    if (!charge) throw new NotFoundException('Cargo no encontrado');
    await this.assertFinanceStaffOfSchool(req.user, charge.schoolId);
    return this.chargesService.remove(charge.id);
  }

  @Post('study-plan-config')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Update study plan financial config' })
  async updateStudyPlanFinancialConfig(@Req() req: AuthenticatedRequest, @Body() input: UpdateStudyPlanFinancialInput) {
    const plan = await this.prisma.studyPlan.findUnique({ where: { id: input.studyPlanId }, select: { schoolId: true } });
    if (!plan) throw new NotFoundException('Plan de estudio no encontrado');
    await this.assertFinanceStaffOfSchool(req.user, plan.schoolId);
    return this.studyPlansService.updateFinancialConfig(input);
  }

  @Post('charges/regenerate-from-study-plan')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Regenerate study-plan charges for an existing student' })
  async regenerateFromStudyPlan(@Req() req: AuthenticatedRequest, @Body() input: RegenerateStudyPlanChargesInput) {
    await this.assertFinanceStaffOfStudent(req.user, input.studentId);
    return this.chargesService.regenerateFromStudyPlan(input.studentId, input.force ?? false);
  }

  /** Throws 403 unless the caller is finance staff of the school's organization. */
  private async assertFinanceStaffOfSchool(user: AuthUserContext | undefined, schoolId: string): Promise<void> {
    if (!isFinanceStaff(user)) throw new ForbiddenException(FINANCE_DENIED);
    await assertSchoolInOrganization(this.prisma, user, schoolId);
  }

  /** Throws 403 unless the caller is finance staff of the student's organization. */
  private async assertFinanceStaffOfStudent(user: AuthUserContext | undefined, studentId: string): Promise<void> {
    if (!isFinanceStaff(user)) throw new ForbiddenException(FINANCE_DENIED);
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { organizationId: true } });
    if (!student) throw new NotFoundException('Estudiante no encontrado');
    if (student.organizationId !== requireOrganization(user)) throw new ForbiddenException(FINANCE_DENIED);
  }
}

export const FINANCE_DENIED = 'No tienes acceso a las finanzas de esta organización';
export const STUDENT_MISMATCH = 'El estudiante no pertenece a esta escuela';
export const PLAN_MISMATCH = 'El plan de estudio no pertenece a esta escuela';
export const CHARGE_MISMATCH = 'El cargo no pertenece a este estudiante';

const ADMIN_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN']);

/**
 * School finance staff: admins, or a staff role holding VIEW_FINANCIALS. Parents and students hold
 * VIEW_FINANCIALS too, but only for their own or their children's accounts.
 */
export function isFinanceStaff(user: AuthUserContext | undefined): boolean {
  const role = user?.role?.toUpperCase() ?? '';
  if (ADMIN_ROLES.has(role)) return true;
  if (role === 'PARENT' || role === 'STUDENT') return false;
  return !!user?.permissions?.includes(Perm.VIEW_FINANCIALS);
}

