import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignmentSubmissionsService } from './assignment-submissions.service';
import { CreateAssignmentSubmissionInput, CreateSubmissionUploadInput } from './dto/create-submission.input';

@ApiTags('assignment-submissions')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_ASSIGNMENTS)
@Controller('v1/assignment-submissions')
export class AssignmentSubmissionsController {
  constructor(private readonly assignmentSubmissionsService: AssignmentSubmissionsService) {}

  @Post('upload-url')
  @RequirePermissions(Perm.SUBMIT_ASSIGNMENTS)
  @ApiOperation({ summary: 'Presigned upload URL for submission' })
  createSubmissionUploadUrl(@Body() input: CreateSubmissionUploadInput) {
    return this.assignmentSubmissionsService.createUploadUrl(input);
  }

  @Post()
  @RequirePermissions(Perm.SUBMIT_ASSIGNMENTS)
  @ApiOperation({ summary: 'Create submission after upload' })
  createAssignmentSubmission(@Body() input: CreateAssignmentSubmissionInput) {
    return this.assignmentSubmissionsService.createSubmission(input);
  }

  @Delete(':submissionId')
  @RequirePermissions(Perm.MANAGE_ASSIGNMENTS)
  @ApiOperation({ summary: 'Delete submission' })
  deleteAssignmentSubmission(@Param('submissionId') submissionId: string) {
    return this.assignmentSubmissionsService.deleteSubmission(submissionId);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Current user submission for assignment' })
  myAssignmentSubmission(@Query('assignmentId') assignmentId: string) {
    return this.assignmentSubmissionsService.getMySubmission(assignmentId);
  }

  @Get('by-assignment/:assignmentId')
  @ApiOperation({ summary: 'All submissions for assignment' })
  assignmentSubmissions(@Param('assignmentId') assignmentId: string) {
    return this.assignmentSubmissionsService.getSubmissionsByAssignment(assignmentId);
  }

  @Get('students-for-assignment/:assignmentId')
  @ApiOperation({ summary: 'Students with submissions for assignment' })
  studentsForAssignment(@Param('assignmentId') assignmentId: string) {
    return this.assignmentSubmissionsService.getStudentsForAssignment(assignmentId);
  }

  @Get('download-url/:fileId')
  @ApiOperation({ summary: 'Presigned download URL for submission file' })
  createSubmissionDownloadUrl(@Param('fileId') fileId: string) {
    return this.assignmentSubmissionsService.createDownloadUrl(fileId);
  }
}
