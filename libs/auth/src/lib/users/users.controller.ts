import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FetchDataQueryDto } from '@/api-contracts';
import { FetchDataInput } from '../fetch-data-input';
import { AvatarUploadUrlInput } from './dto/avatar-upload-url.input';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { AvatarService } from './avatar.service';
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
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
  ) {}

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

  @Post('avatar-upload-url')
  @ApiOperation({ summary: 'Presigned URL for avatar upload (1:1)' })
  createAvatarUploadUrl(@Body() input: AvatarUploadUrlInput) {
    return this.avatarService.createAvatarUploadUrl(input.userId, input.mimeType);
  }

  @Post('avatar-urls')
  @ApiOperation({ summary: 'Resolve avatar URLs for multiple users' })
  getAvatarUrls(@Body() body: { userIds?: string[] }) {
    return this.avatarService.getAvatarUrls(body.userIds ?? []);
  }

  @Get('avatar-download-url')
  @ApiOperation({ summary: 'Presigned URL for avatar download' })
  getAvatarDownloadUrl(@Query('userId') userId: string) {
    return this.avatarService.createAvatarDownloadUrl(userId);
  }

  @Get(':id/presigned-avatar-url')
  @ApiOperation({ summary: 'Resolve avatar key to presigned URL' })
  async getAvatarUrl(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user?.image) return { url: null as string | null };
    const url = await this.avatarService.getAvatarUrl(user.image);
    return { url };
  }

  @Patch(':id/avatar')
  @ApiOperation({ summary: 'Update user avatar storage key' })
  updateAvatar(@Param('id') id: string, @Body() body: { image: string }) {
    return this.avatarService.updateAvatar(id, body.image);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
