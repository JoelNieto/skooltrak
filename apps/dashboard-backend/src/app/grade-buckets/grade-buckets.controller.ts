import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateGradeBucketInput } from './dto/create-grade-bucket.input';
import { UpdateGradeBucketInput } from './dto/update-grade-bucket.input';
import { GradeBucketsService } from './grade-buckets.service';

@ApiTags('grade-buckets')
@Controller('v1/grade-buckets')
export class GradeBucketsController {
  constructor(private readonly gradeBucketsService: GradeBucketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create grade bucket' })
  create(@Body() createGradeBucketInput: CreateGradeBucketInput) {
    return this.gradeBucketsService.create(createGradeBucketInput);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'Grade buckets by course id' })
  findManyByCourseId(@Param('courseId') courseId: string) {
    return this.gradeBucketsService.findManyByCourseId(courseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get grade bucket by id' })
  findOne(@Param('id') id: string) {
    return this.gradeBucketsService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update grade bucket' })
  update(@Body() updateGradeBucketInput: UpdateGradeBucketInput) {
    return this.gradeBucketsService.update(updateGradeBucketInput.id, updateGradeBucketInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete grade bucket' })
  remove(@Param('id') id: string) {
    return this.gradeBucketsService.remove(id);
  }
}
