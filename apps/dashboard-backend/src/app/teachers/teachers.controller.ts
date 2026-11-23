import { FetchDataQueryDto } from '@/api-contracts';
import { AuthenticatedRequest, AuthUserContext, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import {
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
import { requireOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTeacherInput } from './dto/create-teacher.input';
import { UpdateTeacherInput } from './dto/update-teacher.input';
import { TeachersService } from './teachers.service';

function enrichTeacher(t: {
  firstName: string;
  middleName: string;
  fatherName: string;
  motherName: string;
  user?: { color?: string | null } | Record<string, unknown> | null;
}) {
  const color =
    t.user && typeof t.user === 'object' && 'color' in t.user
      ? ((t.user as { color?: string | null }).color ?? null)
      : null;
  return {
    ...t,
    name: `${t.firstName} ${t.fatherName}`,
    fullName: `${t.firstName} ${t.middleName} ${t.fatherName} ${t.motherName}`,
    color,
    initials: `${t.firstName.charAt(0).toUpperCase()}${t.fatherName.charAt(0).toUpperCase()}`,
  };
}

@ApiTags('teachers')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_TEACHERS)
@Controller('v1/teachers')
export class TeachersController {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @ApiOperation({ summary: 'Create teacher' })
  async create(@Req() req: AuthenticatedRequest, @Body() createTeacherInput: CreateTeacherInput) {
    // The teacher joins the caller's organization, whatever the request says.
    const x = await this.teachersService.create({ ...createTeacherInput, organizationId: requireOrganization(req.user) });
    return enrichTeacher(x);
  }

  @Get()
  @ApiOperation({ summary: 'List teachers' })
  async findAll(@Query() query: FetchDataQueryDto) {
    const resp = await this.teachersService.findAll(query);
    return { ...resp, data: resp.data.map((t) => enrichTeacher(t)) };
  }

  @Get('count')
  @ApiOperation({ summary: 'Teachers count' })
  findManyTeachersCount(@Query() query: FetchDataQueryDto) {
    return this.teachersService.findCount(query);
  }

  @Get('by-organization/:organizationId')
  @ApiOperation({ summary: 'Teachers by organization' })
  async findManyByOrganizationId(@Req() req: AuthenticatedRequest, @Param('organizationId') organizationId: string) {
    if (requireOrganization(req.user) !== organizationId) throw new ForbiddenException(TEACHER_DENIED);
    const list = await this.teachersService.findManyByOrganizationId(organizationId);
    return list.map((t) => enrichTeacher(t));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get teacher by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.assertInOrganization(req.user, id);
    const t = await this.teachersService.findOne(id);
    if (!t) {
      return null;
    }
    return enrichTeacher(t);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @ApiOperation({ summary: 'Update teacher' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateTeacherInput: UpdateTeacherInput) {
    await this.assertInOrganization(req.user, updateTeacherInput.id);
    const x = await this.teachersService.update(updateTeacherInput.id, updateTeacherInput);
    return enrichTeacher(x);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @ApiOperation({ summary: 'Delete teacher' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.assertInOrganization(req.user, id);
    return this.teachersService.remove(id);
  }

  /** Throws 403 unless the teacher belongs to the caller's organization (404 when missing). */
  private async assertInOrganization(user: AuthUserContext | undefined, id: string): Promise<void> {
    const organizationId = requireOrganization(user);
    const teacher = await this.prisma.teacher.findUnique({ where: { id }, select: { organizationId: true } });
    if (!teacher) throw new NotFoundException('Docente no encontrado');
    if (teacher.organizationId !== organizationId) throw new ForbiddenException(TEACHER_DENIED);
  }
}

export const TEACHER_DENIED = 'El docente no pertenece a tu organización';
