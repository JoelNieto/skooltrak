import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateFileDownloadInput } from './dto/create-file-download.input';
import { CreateFileUploadInput } from './dto/create-file-upload.input';
import { CreateFileInput } from './dto/create-file.input';
import { FetchCourseFilesInput } from './dto/fetch-course-files.input';
import { RemoveShareInput } from './dto/remove-share.input';
import { ShareFileInput } from './dto/share-file.input';
import { UpdateShareInput } from './dto/update-share.input';
import { FileDownloadUrl } from './entities/file-download-url.entity';
import { FileUploadUrl } from './entities/file-upload-url.entity';
import { File } from './entities/file.entity';
import { FilesService } from './files.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_FILES)
@Resolver(() => File)
export class FilesResolver {
  constructor(private readonly filesService: FilesService) {}

  @RequirePermissions(Perm.MANAGE_FILES)
  @Mutation(() => File)
  createFile(@Args('createFileInput') createFileInput: CreateFileInput) {
    return this.filesService.create(createFileInput);
  }

  @RequirePermissions(Perm.MANAGE_FILES)
  @Mutation(() => FileUploadUrl)
  createFileUploadUrl(@Args('createFileUploadInput') createFileUploadInput: CreateFileUploadInput) {
    return this.filesService.createUploadUrl(createFileUploadInput);
  }

  @Mutation(() => FileDownloadUrl)
  createFileDownloadUrl(
    @Args('createFileDownloadInput')
    createFileDownloadInput: CreateFileDownloadInput,
  ) {
    return this.filesService.createDownloadUrl(createFileDownloadInput);
  }

  @Query(() => [File], { name: 'filesAccessible' })
  filesAccessible(@Args() query: FetchDataInput) {
    return this.filesService.findAccessible(query);
  }

  @Query(() => [File], { name: 'filesOwned' })
  filesOwned(@Args() query: FetchDataInput) {
    return this.filesService.findOwned(query);
  }

  @Query(() => [File], { name: 'filesSharedWithMe' })
  filesSharedWithMe(@Args() query: FetchDataInput) {
    return this.filesService.findSharedWithMe(query);
  }

  @Query(() => [File], { name: 'filesForCourse' })
  filesForCourse(@Args() query: FetchCourseFilesInput) {
    return this.filesService.findByCourse(query);
  }

  @Query(() => File, { name: 'fileById' })
  fileById(@Args('id', { type: () => String }) id: string) {
    return this.filesService.findOne(id);
  }

  @RequirePermissions(Perm.MANAGE_FILES)
  @Mutation(() => File)
  shareFile(@Args('shareFileInput') shareFileInput: ShareFileInput) {
    return this.filesService.share(shareFileInput);
  }

  @RequirePermissions(Perm.MANAGE_FILES)
  @Mutation(() => File)
  updateShare(@Args('updateShareInput') updateShareInput: UpdateShareInput) {
    return this.filesService.updateShare(updateShareInput);
  }

  @RequirePermissions(Perm.MANAGE_FILES)
  @Mutation(() => File)
  removeShare(@Args('removeShareInput') removeShareInput: RemoveShareInput) {
    return this.filesService.removeShare(removeShareInput);
  }
}
