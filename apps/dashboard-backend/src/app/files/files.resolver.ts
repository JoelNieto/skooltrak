import { BetterAuthGuard } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateFileInput } from './dto/create-file.input';
import { CreateFileDownloadInput } from './dto/create-file-download.input';
import { CreateFileUploadInput } from './dto/create-file-upload.input';
import { FetchCourseFilesInput } from './dto/fetch-course-files.input';
import { RemoveShareInput } from './dto/remove-share.input';
import { ShareFileInput } from './dto/share-file.input';
import { UpdateShareInput } from './dto/update-share.input';
import { File } from './entities/file.entity';
import { FileDownloadUrl } from './entities/file-download-url.entity';
import { FileUploadUrl } from './entities/file-upload-url.entity';
import { FilesService } from './files.service';

@Resolver(() => File)
export class FilesResolver {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(BetterAuthGuard)
  @Mutation(() => File)
  createFile(@Args('createFileInput') createFileInput: CreateFileInput) {
    return this.filesService.create(createFileInput);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => FileUploadUrl)
  createFileUploadUrl(
    @Args('createFileUploadInput') createFileUploadInput: CreateFileUploadInput
  ) {
    return this.filesService.createUploadUrl(createFileUploadInput);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => FileDownloadUrl)
  createFileDownloadUrl(
    @Args('createFileDownloadInput')
    createFileDownloadInput: CreateFileDownloadInput
  ) {
    return this.filesService.createDownloadUrl(createFileDownloadInput);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [File], { name: 'filesAccessible' })
  filesAccessible(@Args() query: FetchDataInput) {
    return this.filesService.findAccessible(query);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [File], { name: 'filesOwned' })
  filesOwned(@Args() query: FetchDataInput) {
    return this.filesService.findOwned(query);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [File], { name: 'filesSharedWithMe' })
  filesSharedWithMe(@Args() query: FetchDataInput) {
    return this.filesService.findSharedWithMe(query);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [File], { name: 'filesForCourse' })
  filesForCourse(@Args() query: FetchCourseFilesInput) {
    return this.filesService.findByCourse(query);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => File, { name: 'fileById' })
  fileById(@Args('id', { type: () => String }) id: string) {
    return this.filesService.findOne(id);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => File)
  shareFile(@Args('shareFileInput') shareFileInput: ShareFileInput) {
    return this.filesService.share(shareFileInput);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => File)
  updateShare(@Args('updateShareInput') updateShareInput: UpdateShareInput) {
    return this.filesService.updateShare(updateShareInput);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => File)
  removeShare(@Args('removeShareInput') removeShareInput: RemoveShareInput) {
    return this.filesService.removeShare(removeShareInput);
  }
}
