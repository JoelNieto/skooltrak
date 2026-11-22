import { FetchDataQueryDto } from '@/api-contracts';
import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertSchoolInOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { CreateStudyPlanInput } from './dto/create-study-plan.input';
import { UpdateStudyPlanInput } from './dto/update-study-plan.input';
import { StudyPlansService } from './study-plans.service';

export const DEGREE_MISMATCH = 'El grado no pertenece a la escuela del plan de estudio';

/**
 * Study plans belong to a school. Reads need VIEW_STUDY_PLANS, writes MANAGE_STUDY_PLANS, and the
 * school must be in the caller's organization.
 */
@ApiTags('study-plans')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_STUDY_PLANS)
@Controller('v1/study-plans')
export class StudyPlansController {
  constructor(
    private readonly studyPlansService: StudyPlansService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_STUDY_PLANS)
  @ApiOperation({ summary: 'Create study plan' })
  async create(@Req() req: AuthenticatedRequest, @Body() createStudyPlanInput: CreateStudyPlanInput) {
    await assertSchoolInOrganization(this.prisma, req.user, createStudyPlanInput.schoolId);
    await this.assertDegreeInSchool(createStudyPlanInput.degreeId, createStudyPlanInput.schoolId);
    return this.studyPlansService.create(createStudyPlanInput);
  }

  @Get()
  @ApiOperation({ summary: 'List study plans' })
  async findAll(@Req() req: AuthenticatedRequest, @Query() query: FetchDataQueryDto) {
    await assertSchoolInOrganization(this.prisma, req.user, query.schoolId);
    return this.studyPlansService.findMany(query);
  }

  @Get('by-school')
  @ApiOperation({ summary: 'Study plans by school (optional degreeId)' })
  async findAllBySchoolId(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('degreeId') degreeId?: string,
  ) {
    if (!schoolId) return [];
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.studyPlansService.findAllBySchoolId(schoolId, degreeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get study plan by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const plan = await this.ref(id);
    await assertSchoolInOrganization(this.prisma, req.user, plan.schoolId);
    return this.studyPlansService.findOne(plan.id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_STUDY_PLANS)
  @ApiOperation({ summary: 'Update study plan' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateStudyPlanInput: UpdateStudyPlanInput) {
    const plan = await this.ref(updateStudyPlanInput.id);
    await assertSchoolInOrganization(this.prisma, req.user, plan.schoolId);
    const schoolId = updateStudyPlanInput.schoolId ?? plan.schoolId;
    if (schoolId !== plan.schoolId) await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    if (updateStudyPlanInput.degreeId || schoolId !== plan.schoolId) {
      await this.assertDegreeInSchool(updateStudyPlanInput.degreeId ?? plan.degreeId, schoolId);
    }
    return this.studyPlansService.update(plan.id, updateStudyPlanInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_STUDY_PLANS)
  @ApiOperation({ summary: 'Delete study plan' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const plan = await this.ref(id);
    await assertSchoolInOrganization(this.prisma, req.user, plan.schoolId);
    return this.studyPlansService.remove(plan.id);
  }

  private async ref(id: string) {
    const plan = await this.prisma.studyPlan.findUnique({
      where: { id },
      select: { id: true, schoolId: true, degreeId: true },
    });
    if (!plan) throw new NotFoundException('Plan de estudio no encontrado');
    return plan;
  }

  /** A plan's degree must belong to the plan's school (400 otherwise). */
  private async assertDegreeInSchool(degreeId: string | undefined, schoolId: string): Promise<void> {
    if (!degreeId) return;
    const found = await this.prisma.degree.count({ where: { id: degreeId, schoolId } });
    if (!found) throw new BadRequestException(DEGREE_MISMATCH);
  }
}
