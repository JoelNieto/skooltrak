import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertSchoolInOrganization, requireOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { DegreesService } from './degrees.service';
import { CreateDegreeInput } from './dto/create-degree.input';
import { UpdateDegreeInput } from './dto/update-degree.input';

/**
 * Degrees belong to a school. Reads need VIEW_STUDY_PLANS, writes MANAGE_STUDY_PLANS, and the
 * school must be in the caller's organization. A degree holds the grade metric its study
 * plans inherit.
 */
@ApiTags('degrees')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_STUDY_PLANS)
@Controller('v1/degrees')
export class DegreesController {
  constructor(
    private readonly degreesService: DegreesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_STUDY_PLANS)
  @ApiOperation({ summary: 'Create degree' })
  async create(@Req() req: AuthenticatedRequest, @Body() createDegreeInput: CreateDegreeInput) {
    await assertSchoolInOrganization(this.prisma, req.user, createDegreeInput.schoolId);
    return this.degreesService.create(createDegreeInput);
  }

  @Get()
  @ApiOperation({ summary: "List the organization's degrees" })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.degreesService.findAll(requireOrganization(req.user));
  }

  @Get('by-school/count')
  @ApiOperation({ summary: 'Degrees count by school' })
  async degreesBySchoolIdCount(@Req() req: AuthenticatedRequest, @Query('schoolId') schoolId: string) {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.degreesService.countBySchoolId(schoolId);
  }

  @Get('by-school')
  @ApiOperation({ summary: 'Degrees by school id' })
  async findManyBySchoolId(
    @Req() req: AuthenticatedRequest,
    @Query('schoolId') schoolId: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.degreesService.findManyBySchoolId(schoolId, {
      take: take != null ? Number(take) : undefined,
      skip: skip != null ? Number(skip) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get degree by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const degree = await this.degreesService.ref(id);
    await assertSchoolInOrganization(this.prisma, req.user, degree.schoolId);
    return this.degreesService.findOne(degree.id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_STUDY_PLANS)
  @ApiOperation({ summary: 'Update degree' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateDegreeInput: UpdateDegreeInput) {
    const degree = await this.degreesService.ref(updateDegreeInput.id);
    await assertSchoolInOrganization(this.prisma, req.user, degree.schoolId);
    if (updateDegreeInput.schoolId) {
      await assertSchoolInOrganization(this.prisma, req.user, updateDegreeInput.schoolId);
    }
    return this.degreesService.update(degree.id, updateDegreeInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_STUDY_PLANS)
  @ApiOperation({ summary: 'Delete degree' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const degree = await this.degreesService.ref(id);
    await assertSchoolInOrganization(this.prisma, req.user, degree.schoolId);
    return this.degreesService.remove(degree.id);
  }
}
