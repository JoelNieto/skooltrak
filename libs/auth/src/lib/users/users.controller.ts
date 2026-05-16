import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FetchDataQueryDto } from '@/api-contracts';
import { FetchDataInput } from '../fetch-data-input';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UsersService } from './users.service';

function toFetchDataInput(q: FetchDataQueryDto): FetchDataInput {
  return {
    skip: q.skip,
    take: q.take,
    orderBy: q.orderBy ?? 'name',
    orderDirection: q.orderDirection ?? 'asc',
    schoolId: q.schoolId,
    studyPlanId: q.studyPlanId,
    search: q.search ?? '',
  };
}

function enrichUser(user: unknown) {
  if (!user || typeof user !== 'object') return user;
  const u = user as { firstName: string; lastName: string };
  return {
    ...(user as Record<string, unknown>),
    name: `${u.firstName} ${u.lastName}`,
    initials: `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`,
  };
}

@ApiTags('users')
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  create(@Body() createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput).then((u) => enrichUser(u));
  }

  @Get()
  @ApiOperation({ summary: 'List users' })
  async findAll(@Query() query: FetchDataQueryDto) {
    const list = await this.usersService.findAll(toFetchDataInput(query));
    return list.map((u) => enrichUser(u));
  }

  @Get('count')
  @ApiOperation({ summary: 'Users count' })
  count(@Query() query: FetchDataQueryDto) {
    return this.usersService.count(toFetchDataInput(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  async findOne(@Param('id') id: string) {
    const u = await this.usersService.findOne(id);
    return enrichUser(u);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user' })
  update(@Body() updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput).then((u) => enrichUser(u));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
