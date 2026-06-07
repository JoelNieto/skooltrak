import { FetchDataQueryDto } from '@/api-contracts';
import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toFetchDataInput } from '../fetch-data-query.mapper';
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
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @ApiOperation({ summary: 'Create teacher' })
  async create(@Body() createTeacherInput: CreateTeacherInput) {
    const x = await this.teachersService.create(createTeacherInput);
    return enrichTeacher(x);
  }

  @Get()
  @ApiOperation({ summary: 'List teachers' })
  async findAll(@Query() query: FetchDataQueryDto) {
    const list = await this.teachersService.findAll(toFetchDataInput(query));
    return list.map((t) => enrichTeacher(t));
  }

  @Get('count')
  @ApiOperation({ summary: 'Teachers count' })
  findManyTeachersCount(@Query() query: FetchDataQueryDto) {
    return this.teachersService.findCount(toFetchDataInput(query));
  }

  @Get('by-organization/:organizationId')
  @ApiOperation({ summary: 'Teachers by organization' })
  async findManyByOrganizationId(@Param('organizationId') organizationId: string) {
    const list = await this.teachersService.findManyByOrganizationId(organizationId);
    return list.map((t) => enrichTeacher(t));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get teacher by id' })
  async findOne(@Param('id') id: string) {
    const t = await this.teachersService.findOne(id);
    if (!t) {
      return null;
    }
    return enrichTeacher(t);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @ApiOperation({ summary: 'Update teacher' })
  async update(@Body() updateTeacherInput: UpdateTeacherInput) {
    const x = await this.teachersService.update(updateTeacherInput.id, updateTeacherInput);
    return enrichTeacher(x);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_TEACHERS)
  @ApiOperation({ summary: 'Delete teacher' })
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
