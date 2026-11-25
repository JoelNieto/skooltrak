import { AuthenticatedRequest, AuthUserContext, Perm, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { assertSchoolInOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { CreatePeriodInput } from './dto/create-period.input';
import { SchoolPeriodOverrideInput } from './dto/school-period-override.input';
import { UpdatePeriodInput } from './dto/update-period.input';
import { SchoolPeriod } from './entities/school-period.entity';
import { PeriodsService } from './periods.service';

export const PERIODS_PLATFORM_ONLY = 'Los periodos se gestionan desde la administración de la plataforma';

/** Periods are shared by every organization: any signed-in user reads them, only SYSADMIN changes them. */
function assertSysadmin(user: AuthUserContext | undefined): void {
  if (user?.role?.toUpperCase() !== 'SYSADMIN') throw new ForbiddenException(PERIODS_PLATFORM_ONLY);
}

/**
 * Global periods are managed by the platform (SYSADMIN). A school of the caller's organization can
 * override each period's name, short name and dates; reads with `schoolId` apply those overrides.
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
  @ApiOperation({ summary: 'List periods (with schoolId: as that school sees them)' })
  @ApiQuery({ name: 'schoolId', required: false })
  async findAll(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId?: string) {
    if (schoolId) await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.findAll(schoolId);
  }

  @Get('by-year')
  @ApiOperation({ summary: 'Periods by year (with schoolId: as that school sees them)' })
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
  @ApiOperation({ summary: "A school's periods of one year, with global defaults and the school's overrides" })
  @ApiOkResponse({ type: SchoolPeriod, isArray: true })
  async schoolPeriods(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Query('year') year: string,
  ): Promise<SchoolPeriod[]> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.schoolPeriods(schoolId, Number(year));
  }

  @Put('schools/:schoolId/:periodId')
  @RequirePermissions(Perm.MANAGE_PERIODS)
  @ApiOperation({ summary: "Set a school's override of one period" })
  @ApiOkResponse({ type: SchoolPeriod })
  async setOverride(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Param('periodId') periodId: string,
    @Body() input: SchoolPeriodOverrideInput,
  ): Promise<SchoolPeriod> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.setOverride(schoolId, periodId, input);
  }

  @Delete('schools/:schoolId/:periodId')
  @RequirePermissions(Perm.MANAGE_PERIODS)
  @ApiOperation({ summary: "Remove a school's override of one period" })
  @ApiOkResponse({ type: SchoolPeriod })
  async clearOverride(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Param('periodId') periodId: string,
  ): Promise<SchoolPeriod> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.periodsService.clearOverride(schoolId, periodId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get period by id' })
  findOne(@Param('id') id: string) {
    return this.periodsService.findOne(id);
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
