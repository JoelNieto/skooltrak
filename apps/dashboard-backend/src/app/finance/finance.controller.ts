import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import { AccountsService } from './accounts.service';
import { ChargesService } from './charges.service';
import { CreateChargeInput, CreateChargeResult } from './dto/create-charge.input';
import { FinanceAccountDetail, FinanceAccountList } from './entities/finance.entity';
import { assertFinanceStaffOfSchool } from './finance-access';

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
}
