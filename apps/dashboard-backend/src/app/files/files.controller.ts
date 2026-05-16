import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { FetchDataQueryDto } from '@/api-contracts';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toFetchCourseFilesInput, toFetchDataInput } from '../fetch-data-query.mapper';
import { CreateFileDownloadInput } from './dto/create-file-download.input';
import { CreateFileUploadInput } from './dto/create-file-upload.input';
import { CreateFileInput } from './dto/create-file.input';
import { RemoveShareInput } from './dto/remove-share.input';
import { ShareFileInput } from './dto/share-file.input';
import { UpdateShareInput } from './dto/update-share.input';
import { FilesService } from './files.service';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_FILES)
@Controller('v1/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_FILES)
  @ApiOperation({ summary: 'Create file record' })
  create(@Body() createFileInput: CreateFileInput) {
    return this.filesService.create(createFileInput);
  }

  @Post('upload-url')
  @RequirePermissions(Perm.MANAGE_FILES)
  @ApiOperation({ summary: 'Presigned upload URL' })
  createFileUploadUrl(@Body() createFileUploadInput: CreateFileUploadInput) {
    return this.filesService.createUploadUrl(createFileUploadInput);
  }

  @Post('download-url')
  @ApiOperation({ summary: 'Presigned download URL' })
  createFileDownloadUrl(@Body() createFileDownloadInput: CreateFileDownloadInput) {
    return this.filesService.createDownloadUrl(createFileDownloadInput);
  }

  @Get('accessible')
  @ApiOperation({ summary: 'Files accessible to user' })
  filesAccessible(@Query() query: FetchDataQueryDto) {
    return this.filesService.findAccessible(toFetchDataInput(query));
  }

  @Get('owned')
  @ApiOperation({ summary: 'Owned files' })
  filesOwned(@Query() query: FetchDataQueryDto) {
    return this.filesService.findOwned(toFetchDataInput(query));
  }

  @Get('shared-with-me')
  @ApiOperation({ summary: 'Files shared with me' })
  filesSharedWithMe(@Query() query: FetchDataQueryDto) {
    return this.filesService.findSharedWithMe(toFetchDataInput(query));
  }

  @Get('for-course')
  @ApiOperation({ summary: 'Files for course' })
  filesForCourse(@Query() query: FetchDataQueryDto & { courseId: string }) {
    return this.filesService.findByCourse(toFetchCourseFilesInput(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'File by id' })
  fileById(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Post('share')
  @RequirePermissions(Perm.MANAGE_FILES)
  @ApiOperation({ summary: 'Share file' })
  shareFile(@Body() shareFileInput: ShareFileInput) {
    return this.filesService.share(shareFileInput);
  }

  @Post('share/update')
  @RequirePermissions(Perm.MANAGE_FILES)
  @ApiOperation({ summary: 'Update share' })
  updateShare(@Body() updateShareInput: UpdateShareInput) {
    return this.filesService.updateShare(updateShareInput);
  }

  @Post('share/remove')
  @RequirePermissions(Perm.MANAGE_FILES)
  @ApiOperation({ summary: 'Remove share' })
  removeShare(@Body() removeShareInput: RemoveShareInput) {
    return this.filesService.removeShare(removeShareInput);
  }
}
