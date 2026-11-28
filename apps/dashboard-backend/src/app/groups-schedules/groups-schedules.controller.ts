import {
  AuthenticatedRequest,
  AuthUserContext,
  BetterAuthGuard,
  Perm,
  PermissionsGuard,
  RequirePermissions,
} from '@/auth';
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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { requireOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { CreateGroupsScheduleInput } from './dto/create-groups-schedule.input';
import { UpdateGroupsScheduleInput } from './dto/update-groups-schedule.input';
import { GroupsSchedulesService } from './groups-schedules.service';

export const GROUP_DENIED = 'No tienes acceso al horario de este grupo';
export const COURSE_MISMATCH = 'El curso no pertenece a la escuela del grupo';

const STAFF_ROLES = new Set(['ORG_ADMIN', 'ADMIN', 'SYSADMIN', 'TEACHER']);

/**
 * A class group's weekly schedule. Reads need VIEW_SCHEDULES: staff of the group's organization,
 * its students, and parents of its students. Writes need MANAGE_SCHEDULES, a group of the caller's
 * organization and a course of the group's school.
 */
@ApiTags('groups-schedules')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_SCHEDULES)
@Controller('v1/groups-schedules')
export class GroupsSchedulesController {
  constructor(
    private readonly groupsSchedulesService: GroupsSchedulesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Create groups schedule' })
  async create(@Req() req: AuthenticatedRequest, @Body() createGroupsScheduleInput: CreateGroupsScheduleInput) {
    const group = await this.assertGroupInOrganization(req.user, createGroupsScheduleInput.classGroupId);
    await this.assertCourseInSchool(createGroupsScheduleInput.courseId, group);
    await this.groupsSchedulesService.assertNoClash(createGroupsScheduleInput);
    return this.groupsSchedulesService.create(createGroupsScheduleInput);
  }

  @Get()
  @RequirePermissions(Perm.MANAGE_SCHEDULES)
  @ApiOperation({ summary: "List the organization's group schedules" })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.groupsSchedulesService.findAll(requireOrganization(req.user));
  }

  @Get('by-class-group/:classGroupId/grouped')
  @ApiOperation({ summary: 'Schedules by class group (grouped)' })
  async findAllByClassGroupIdGrouped(@Req() req: AuthenticatedRequest, @Param('classGroupId') classGroupId: string) {
    await this.assertCanReadGroup(req.user, classGroupId);
    return this.groupsSchedulesService.findAllByClassGroupIdGrouped(classGroupId);
  }

  @Get('by-class-group/:classGroupId/teacher-busy')
  @RequirePermissions(Perm.MANAGE_SCHEDULES)
  @ApiOperation({ summary: "Other groups' slots taught by this group's teachers (editor clash check)" })
  async findTeacherBusy(@Req() req: AuthenticatedRequest, @Param('classGroupId') classGroupId: string) {
    await this.assertGroupInOrganization(req.user, classGroupId);
    return this.groupsSchedulesService.findTeacherBusy(classGroupId);
  }

  @Get('by-class-group/:classGroupId')
  @ApiOperation({ summary: 'Schedules by class group' })
  async findAllByClassGroupId(@Req() req: AuthenticatedRequest, @Param('classGroupId') classGroupId: string) {
    await this.assertCanReadGroup(req.user, classGroupId);
    return this.groupsSchedulesService.findAllByClassGroupId(classGroupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get groups schedule by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const slot = await this.ref(id);
    await this.assertCanReadGroup(req.user, slot.classGroupId);
    return this.groupsSchedulesService.findOne(slot.id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Update groups schedule' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateGroupsScheduleInput: UpdateGroupsScheduleInput) {
    const slot = await this.ref(updateGroupsScheduleInput.id);
    let group = await this.assertGroupInOrganization(req.user, slot.classGroupId);
    if (updateGroupsScheduleInput.classGroupId && updateGroupsScheduleInput.classGroupId !== slot.classGroupId) {
      group = await this.assertGroupInOrganization(req.user, updateGroupsScheduleInput.classGroupId);
    }
    if (updateGroupsScheduleInput.courseId || group.id !== slot.classGroupId) {
      await this.assertCourseInSchool(updateGroupsScheduleInput.courseId ?? slot.courseId, group);
    }
    const next = {
      id: slot.id,
      classGroupId: group.id,
      courseId: updateGroupsScheduleInput.courseId ?? slot.courseId,
      weekday: updateGroupsScheduleInput.weekday ?? slot.weekday,
      startTime: updateGroupsScheduleInput.startTime ?? slot.startTime,
      endTime: updateGroupsScheduleInput.endTime ?? slot.endTime,
      recess: updateGroupsScheduleInput.recess ?? slot.recess,
    };
    const moved =
      next.classGroupId !== slot.classGroupId ||
      next.courseId !== slot.courseId ||
      next.weekday !== slot.weekday ||
      next.startTime !== slot.startTime ||
      next.endTime !== slot.endTime ||
      next.recess !== slot.recess;
    // Only re-check when the slot moves: editing the room of an old overlapping slot stays possible.
    if (moved) await this.groupsSchedulesService.assertNoClash(next);
    return this.groupsSchedulesService.update(slot.id, updateGroupsScheduleInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Delete groups schedule' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const slot = await this.ref(id);
    await this.assertGroupInOrganization(req.user, slot.classGroupId);
    return this.groupsSchedulesService.remove(slot.id);
  }

  private async ref(id: string) {
    const slot = await this.prisma.classGroupWeeklySchedule.findUnique({
      where: { id },
      select: {
        id: true,
        classGroupId: true,
        courseId: true,
        weekday: true,
        startTime: true,
        endTime: true,
        recess: true,
      },
    });
    if (!slot) throw new NotFoundException('Horario no encontrado');
    return slot;
  }

  private async group(classGroupId: string) {
    const group = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
      select: { id: true, organizationId: true, schoolId: true },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return group;
  }

  private async assertGroupInOrganization(user: AuthUserContext | undefined, classGroupId: string) {
    const organizationId = requireOrganization(user);
    const group = await this.group(classGroupId);
    if (group.organizationId !== organizationId) throw new ForbiddenException(GROUP_DENIED);
    return group;
  }

  /** Staff of the group's organization, a student of the group, or a parent of one (any organization). */
  private async assertCanReadGroup(user: AuthUserContext | undefined, classGroupId: string): Promise<void> {
    if (!user?.userId) throw new ForbiddenException('Not authenticated');
    const group = await this.group(classGroupId);
    const role = user.role?.toUpperCase() ?? '';
    const sameOrg = user.organizationId === group.organizationId;
    if (sameOrg && STAFF_ROLES.has(role)) return;
    if (role === 'STUDENT' && sameOrg) {
      if (await this.prisma.student.count({ where: { classGroupId, userId: user.userId } })) return;
    }
    if (role === 'PARENT') {
      if (await this.prisma.student.count({ where: { classGroupId, parents: { some: { userId: user.userId } } } })) {
        return;
      }
    }
    throw new ForbiddenException(GROUP_DENIED);
  }

  /** A slot's course must be taught in the group's school and organization (400 otherwise). */
  private async assertCourseInSchool(
    courseId: string,
    group: { organizationId: string; schoolId: string },
  ): Promise<void> {
    const found = await this.prisma.course.count({
      where: { id: courseId, organizationId: group.organizationId, schoolId: group.schoolId },
    });
    if (!found) throw new BadRequestException(COURSE_MISMATCH);
  }
}
