import { FetchDataQueryDto } from '@/api-contracts';
import { AuthenticatedRequest, AuthUserContext, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { assertSchoolInOrganization, requireOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { ClassGroupsService } from './class-groups.service';
import { CreateClassGroupInput } from './dto/create-class-group.input';
import { UpdateClassGroupInput } from './dto/update-class-group.input';

export const GROUP_DENIED = 'El grupo no pertenece a tu organización';
export const PLAN_MISMATCH = 'El plan de estudio no pertenece a la escuela del grupo';
export const TEACHER_MISMATCH = 'El docente no pertenece a tu organización';

/**
 * Class groups. Reads need VIEW_CLASS_GROUPS, writes MANAGE_CLASS_GROUPS; everything stays in the
 * caller's organization. Students only see their own group, without classmates' document ids.
 */
@ApiTags('class-groups')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_CLASS_GROUPS)
@Controller('v1/class-groups')
export class ClassGroupsController {
  constructor(
    private readonly classGroupsService: ClassGroupsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_CLASS_GROUPS)
  @ApiOperation({ summary: 'Create class group' })
  async create(@Req() req: AuthenticatedRequest, @Body() createClassGroupInput: CreateClassGroupInput) {
    const organizationId = await assertSchoolInOrganization(this.prisma, req.user, createClassGroupInput.schoolId);
    await this.assertFits(organizationId, createClassGroupInput.schoolId, createClassGroupInput);
    return this.classGroupsService.create({ ...createClassGroupInput, organizationId });
  }

  @Get()
  @ApiOperation({ summary: 'List class groups' })
  async findAll(@Req() req: AuthenticatedRequest, @Query() query: FetchDataQueryDto) {
    const organizationId = await this.listScope(req.user, query);
    return this.classGroupsService.findAll(query, organizationId, await this.studentGroupIds(req.user));
  }

  @Get('count')
  @ApiOperation({ summary: 'Class groups count' })
  async count(@Req() req: AuthenticatedRequest, @Query() query: FetchDataQueryDto) {
    const organizationId = await this.listScope(req.user, query);
    return this.classGroupsService.count(query, organizationId, await this.studentGroupIds(req.user));
  }

  @Get('by-organization/:organizationId')
  @ApiOperation({ summary: 'Class groups by organization' })
  async findAllByOrganizationId(@Req() req: AuthenticatedRequest, @Param('organizationId') organizationId: string) {
    if (requireOrganization(req.user) !== organizationId) throw new ForbiddenException(GROUP_DENIED);
    return this.ownOnly(req.user, await this.classGroupsService.findAllByOrganizationId(organizationId));
  }

  @Get('by-school/:schoolId')
  @ApiOperation({ summary: 'Class groups by school' })
  async findAllBySchoolId(@Req() req: AuthenticatedRequest, @Param('schoolId') schoolId: string) {
    await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    return this.ownOnly(req.user, await this.classGroupsService.findAllBySchoolId(schoolId));
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Class groups by course' })
  async findAllByCourseId(@Req() req: AuthenticatedRequest, @Param('courseId') courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { organizationId: true } });
    if (!course) throw new NotFoundException('Curso no encontrado');
    if (course.organizationId !== requireOrganization(req.user)) throw new ForbiddenException(GROUP_DENIED);
    return this.ownOnly(req.user, await this.classGroupsService.findAllByCourseId(courseId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class group by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const group = await this.groupInOrganization(req.user, id);
    const student = await this.viewerStudent(req.user);
    if (student && student.classGroupId !== group.id) throw new ForbiddenException(GROUP_DENIED);
    return this.classGroupsService.findOne(group.id, student?.id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_CLASS_GROUPS)
  @ApiOperation({ summary: 'Update class group' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateClassGroupInput: UpdateClassGroupInput) {
    const group = await this.groupInOrganization(req.user, updateClassGroupInput.id);
    if (updateClassGroupInput.organizationId && updateClassGroupInput.organizationId !== group.organizationId) {
      throw new ForbiddenException(GROUP_DENIED);
    }
    const schoolId = updateClassGroupInput.schoolId ?? group.schoolId;
    if (schoolId !== group.schoolId) await assertSchoolInOrganization(this.prisma, req.user, schoolId);
    await this.assertFits(group.organizationId, schoolId, {
      // A school change re-checks the plan against the new school.
      studyPlanId: updateClassGroupInput.studyPlanId ?? (schoolId !== group.schoolId ? group.studyPlanId : undefined),
      teacherId: updateClassGroupInput.teacherId,
    });
    return this.classGroupsService.update(group.id, updateClassGroupInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_CLASS_GROUPS)
  @ApiOperation({ summary: 'Delete class group' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const group = await this.groupInOrganization(req.user, id);
    return this.classGroupsService.remove(group.id);
  }

  /** A student caller's own student record (null for everyone else); 403 when they have none. */
  private async viewerStudent(user: AuthUserContext | undefined) {
    if (user?.role?.toUpperCase() !== 'STUDENT') return null;
    const student = await this.prisma.student.findFirst({
      where: { userId: user.userId, organizationId: requireOrganization(user) },
      select: { id: true, classGroupId: true },
    });
    if (!student) throw new ForbiddenException(GROUP_DENIED);
    return student;
  }

  /** Students only see their own group; undefined (no filter) for everyone else. */
  private async studentGroupIds(user: AuthUserContext | undefined): Promise<string[] | undefined> {
    const student = await this.viewerStudent(user);
    if (!student) return undefined;
    return student.classGroupId ? [student.classGroupId] : [];
  }

  private async ownOnly<G extends { id: string }>(user: AuthUserContext | undefined, groups: G[]): Promise<G[]> {
    const own = await this.studentGroupIds(user);
    return own ? groups.filter((g) => own.includes(g.id)) : groups;
  }

  /** The caller's organization, and the requested school when given (which must be in it). */
  private async listScope(user: AuthUserContext | undefined, query: FetchDataQueryDto): Promise<string> {
    if (query.schoolId) return assertSchoolInOrganization(this.prisma, user, query.schoolId);
    return requireOrganization(user);
  }

  private async groupInOrganization(user: AuthUserContext | undefined, id: string) {
    const organizationId = requireOrganization(user);
    const group = await this.prisma.classGroup.findUnique({
      where: { id },
      select: { id: true, organizationId: true, schoolId: true, studyPlanId: true },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (group.organizationId !== organizationId) throw new ForbiddenException(GROUP_DENIED);
    return group;
  }

  /** The plan must be the school's, and the homeroom teacher the organization's (400 otherwise). */
  private async assertFits(
    organizationId: string,
    schoolId: string,
    input: { studyPlanId?: string; teacherId?: string | null },
  ): Promise<void> {
    if (input.studyPlanId) {
      const found = await this.prisma.studyPlan.count({ where: { id: input.studyPlanId, schoolId } });
      if (!found) throw new BadRequestException(PLAN_MISMATCH);
    }
    if (input.teacherId) {
      const found = await this.prisma.teacher.count({ where: { id: input.teacherId, organizationId } });
      if (!found) throw new BadRequestException(TEACHER_MISMATCH);
    }
  }
}
