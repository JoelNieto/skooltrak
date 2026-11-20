import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GradeAccessService, MOVE_DENIED } from '../grades/grade-access.service';
import { CreateGradeBucketInput } from './dto/create-grade-bucket.input';
import { UpdateGradeBucketInput } from './dto/update-grade-bucket.input';
import { GradeBucketsService } from './grade-buckets.service';

/**
 * A course's grade weighting. Anyone who may read the course's grades may read its buckets;
 * only the course's teacher or an admin may change them (ASM-001-S01, BR-ASM-001.13).
 */
@ApiTags('grade-buckets')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_GRADES)
@Controller('v1/grade-buckets')
export class GradeBucketsController {
  constructor(
    private readonly gradeBucketsService: GradeBucketsService,
    private readonly access: GradeAccessService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Create grade bucket' })
  async create(@Req() req: AuthenticatedRequest, @Body() createGradeBucketInput: CreateGradeBucketInput) {
    await this.access.assertCanWriteCourse(req.user, createGradeBucketInput.courseId);
    return this.gradeBucketsService.create(createGradeBucketInput);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Grade buckets by course id' })
  async findManyByCourseId(@Req() req: AuthenticatedRequest, @Param('courseId') courseId: string) {
    await this.access.readScope(req.user, courseId);
    return this.gradeBucketsService.findManyByCourseId(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grade bucket by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const bucket = await this.access.bucketRef(id);
    await this.access.readScope(req.user, bucket.courseId);
    return this.gradeBucketsService.findOne(id);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Update grade bucket' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateGradeBucketInput: UpdateGradeBucketInput) {
    const bucket = await this.access.bucketRef(updateGradeBucketInput.id);
    await this.access.assertCanWriteCourse(req.user, bucket.courseId);
    if (updateGradeBucketInput.courseId && updateGradeBucketInput.courseId !== bucket.courseId) {
      throw new BadRequestException(MOVE_DENIED);
    }
    return this.gradeBucketsService.update(bucket.id, updateGradeBucketInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_GRADES)
  @ApiOperation({ summary: 'Delete grade bucket' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const bucket = await this.access.bucketRef(id);
    await this.access.assertCanWriteCourse(req.user, bucket.courseId);
    return this.gradeBucketsService.remove(bucket.id);
  }
}
