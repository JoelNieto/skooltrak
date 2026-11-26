import { AuthenticatedRequest, Perm, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { assertSchoolInOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { CreateSchoolHabitMetricInput, UpdateSchoolHabitMetricInput } from './dto/school-habit-metric.input';
import { SchoolHabitMetric, SchoolHabitMetrics } from './entities/school-habit-metric.entity';
import { HabitMetricsService } from './habit-metrics.service';

/**
 * Habits and aptitudes. The platform defines global ones; a school of the caller's organization can
 * use its own set instead. Reads with `schoolId` return the metrics that school uses.
 */
@ApiTags('habit-metrics')
@Controller('v1/habit-metrics')
export class HabitMetricsController {
  constructor(
    private readonly habitMetricsService: HabitMetricsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List global habit metrics (with schoolId: the ones that school uses)' })
  @ApiQuery({ name: 'schoolId', required: false })
  async findAll(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId?: string) {
    if (schoolId) await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.habitMetricsService.findAll(schoolId);
  }

  @Get('schools/:schoolId')
  @RequirePermissions(Perm.VIEW_SCHOOLS)
  @ApiOperation({ summary: 'The habit metrics a school uses (its own or the global ones), with usage' })
  @ApiOkResponse({ type: SchoolHabitMetrics })
  async schoolMetrics(@Req() req: AuthenticatedRequest, @Param('schoolId') schoolId: string) {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.habitMetricsService.schoolMetrics(schoolId);
  }

  @Post('schools/:schoolId/customize')
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: 'Switch a school to its own habit metrics, starting from a copy of the global ones' })
  @ApiOkResponse({ type: SchoolHabitMetrics })
  async customize(@Req() req: AuthenticatedRequest, @Param('schoolId') schoolId: string) {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.habitMetricsService.customize(schoolId);
  }

  @Post('schools/:schoolId/restore')
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: 'Switch a school back to the global habit metrics' })
  @ApiOkResponse({ type: SchoolHabitMetrics })
  async restoreGlobal(@Req() req: AuthenticatedRequest, @Param('schoolId') schoolId: string) {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.habitMetricsService.restoreGlobal(schoolId);
  }

  @Post('schools/:schoolId')
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: "Add one of a school's own habit metrics" })
  @ApiOkResponse({ type: SchoolHabitMetric })
  async createForSchool(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Body() input: CreateSchoolHabitMetricInput,
  ): Promise<SchoolHabitMetric> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.habitMetricsService.createForSchool(schoolId, input);
  }

  @Patch('schools/:schoolId/:metricId')
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: "Edit one of a school's own habit metrics" })
  @ApiOkResponse({ type: SchoolHabitMetric })
  async updateForSchool(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Param('metricId') metricId: string,
    @Body() input: UpdateSchoolHabitMetricInput,
  ): Promise<SchoolHabitMetric> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.habitMetricsService.updateForSchool(schoolId, metricId, input);
  }

  @Delete('schools/:schoolId/:metricId')
  @RequirePermissions(Perm.MANAGE_SCHOOLS)
  @ApiOperation({ summary: "Delete one of a school's own habit metrics (only while it has no evaluations)" })
  async removeForSchool(
    @Req() req: AuthenticatedRequest,
    @Param('schoolId') schoolId: string,
    @Param('metricId') metricId: string,
  ): Promise<void> {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    await this.habitMetricsService.removeForSchool(schoolId, metricId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get habit metric by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const metric = await this.habitMetricsService.findOne(id);
    if (metric?.schoolId) await assertSchoolInOrganization(this.prisma, req.user, metric.schoolId);
    return metric;
  }
}
