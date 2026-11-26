import { AuthenticatedRequest, AuthUserContext, Perm, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { assertSchoolInOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { CreatePeriodInput } from './dto/create-period.input';
import { CreateSchoolPeriodInput, SchoolPeriodsYearInput, UpdateSchoolPeriodInput } from './dto/school-period.input';
import { UpdatePeriodInput } from './dto/update-period.input';
import { SchoolPeriod, SchoolPeriodsYear } from './entities/school-period.entity';
import { PeriodsService } from './periods.service';

export const PERIODS_PLATFORM_ONLY = 'Los periodos se gestionan desde la administración de la plataforma';

/** Periods are shared by every organization: any signed-in user reads them, only SYSADMIN changes them. */
function assertSysadmin(user: AuthUserContext | undefined): void {
  if (user?.role?.toUpperCase() !== 'SYSADMIN') throw new ForbiddenException(PERIODS_PLATFORM_ONLY);
}

/**
 * Global periods are managed by the platform (SYSADMIN). A school of the caller's organization can
 * instead use its own periods for a year (e.g. an American calendar); reads with `schoolId` return
 * the periods that school uses.
 */
@ApiTags('periods')
@Controller('v1/periods')
export class PeriodsController {
  constructor(
    private readonly periodsService: PeriodsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create period' })
  async create(@Req() req: AuthenticatedRequest, @Body() createPeriodInput: CreatePeriodInput) {
    assertSysadmin(req.user);
    return this.periodsService.create(createPeriodInput);
  }

  @Get()
  @ApiOperation({ summary: 'List global periods (with schoolId: the periods that school uses)' })
  @ApiQuery({ name: 'schoolId', required: false })
  async findAll(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId?: string) {
    if (schoolId) await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.findAll(schoolId);
  }

  @Get('by-year')
  @ApiOperation({ summary: 'Global periods by year (with schoolId: the periods that school uses)' })
  @ApiQuery({ name: 'schoolId', required: false })
  async findManyByYear(
    @Req() req: AuthenticatedRequest,
    @Query('year') year: string,
    @Query('schoolId') schoolId?: string,
  ) {
    if (schoolId) await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.findManyByYear(Number(year), schoolId);
  }

  @Get('schools/:schoolId')
  @RequirePermissions(Perm.VIEW_PERIODS)
  @ApiOperation({ summary: "The periods a school uses in one year (its own or the global ones)" })
  @ApiOkResponse({ type: SchoolPeriodsYear })
  async schoolYear(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Query('year') year: string,
  ): Promise<SchoolPeriodsYear> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.schoolYear(schoolId, Number(year));
  }

  @Post('schools/:schoolId/customize')
  @RequirePermissions(Perm.MANAGE_PERIODS)
  @ApiOperation({ summary: 'Switch a school year to its own periods, starting from a copy of the global ones' })
  @ApiOkResponse({ type: SchoolPeriodsYear })
  async customize(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Body() input: SchoolPeriodsYearInput,
  ): Promise<SchoolPeriodsYear> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.customize(schoolId, Number(input.year));
  }

  @Post('schools/:schoolId/restore')
  @RequirePermissions(Perm.MANAGE_PERIODS)
  @ApiOperation({ summary: 'Switch a school year back to the global periods' })
  @ApiOkResponse({ type: SchoolPeriodsYear })
  async restoreGlobal(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Body() input: SchoolPeriodsYearInput,
  ): Promise<SchoolPeriodsYear> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.restoreGlobal(schoolId, Number(input.year));
  }

  @Post('schools/:schoolId')
  @RequirePermissions(Perm.MANAGE_PERIODS)
  @ApiOperation({ summary: "Add one of a school's own periods" })
  @ApiOkResponse({ type: SchoolPeriod })
  async createForSchool(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Body() input: CreateSchoolPeriodInput,
  ): Promise<SchoolPeriod> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.createForSchool(schoolId, input);
  }

  @Patch('schools/:schoolId/:periodId')
  @RequirePermissions(Perm.MANAGE_PERIODS)
  @ApiOperation({ summary: "Edit one of a school's own periods" })
  @ApiOkResponse({ type: SchoolPeriod })
  async updateForSchool(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Param('periodId') periodId: string,
    @Body() input: UpdateSchoolPeriodInput,
  ): Promise<SchoolPeriod> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.updateForSchool(schoolId, periodId, input);
  }

  @Delete('schools/:schoolId/:periodId')
  @RequirePermissions(Perm.MANAGE_PERIODS)
  @ApiOperation({ summary: "Delete one of a school's own periods (only while it holds no grades)" })
  async removeForSchool(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Param('periodId') periodId: string,
  ): Promise<void> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    await this.periodsService.removeForSchool(schoolId, periodId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get period by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const period = await this.periodsService.findOne(id);
    // A school's own period is only visible inside its organization.
    if (period?.schoolId) await assertSchoolInOrganization(this.prisma, req.user, period.schoolId);
    return period;
  }
  @Patch()
  @ApiOperation({ summary: 'Update period' })
  async update(@Req() req: AuthenticatedRequest, @Body() updatePeriodInput: UpdatePeriodInput) {
    assertSysadmin(req.user);
    return this.periodsService.update(updatePeriodInput.id, updatePeriodInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete period' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    assertSysadmin(req.user);
    return this.periodsService.remove(id);
  }
}
