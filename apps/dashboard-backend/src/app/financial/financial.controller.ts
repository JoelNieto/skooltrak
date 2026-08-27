import {
  AuthUserContext,
  AuthenticatedRequest,
  BetterAuthGuard,
  Perm,
  PermissionsGuard,
  RequirePermissions,
} from '@/auth';
import { ForbiddenException, NotFoundException, UseGuards } from '@nestjs/common';
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
   * Authorizes viewing a student's financials. Staff with VIEW_FINANCIALS may
   * view anyone; a student may view their own; a parent may view their linked
   * children. Throws otherwise.
   */
  private async assertCanViewStudentFinancials(
    req: AuthenticatedRequest,
    studentId: string,
  ) {
    const user = req.user as AuthUserContext | undefined;
    if (!user?.userId) {
      throw new ForbiddenException('No autenticado');
    }
    if (user.permissions?.includes(Perm.VIEW_FINANCIALS)) {
      return;
    }
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, parents: true },
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    const isOwner = student.user?.id === user.userId;
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
  getChargesBySchool(
    @Query('schoolId') schoolId: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('chargeType') chargeType?: string,
    @Query('studentId') studentId?: string,
    @Query('description') description?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
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
  getPaymentsBySchool(
    @Query('schoolId') schoolId: string,
    @Query('year') year?: string,
    @Query('studentId') studentId?: string,
    @Query('reference') reference?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
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

  @Post('charges/regenerate-from-study-plan')
  @RequirePermissions(Perm.MANAGE_FINANCIALS)
  @ApiOperation({ summary: 'Regenerate study-plan charges for an existing student' })
  regenerateFromStudyPlan(@Body() input: RegenerateStudyPlanChargesInput) {
    return this.chargesService.regenerateFromStudyPlan(input.studentId, input.force ?? false);
  }
}

