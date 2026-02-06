import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Student } from '../students/entities/student.entity';
import { AssignmentSubmissionsService } from './assignment-submissions.service';
import { CreateAssignmentSubmissionInput, CreateSubmissionUploadInput } from './dto/create-submission.input';
import { AssignmentSubmission, SubmissionUploadUrl } from './entities/assignment-submission.entity';

@ObjectType()
class SubmissionDownloadUrl {
  @Field(() => String, { description: 'Presigned URL for downloading the file' })
  downloadUrl: string;
}

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_ASSIGNMENTS)
@Resolver(() => AssignmentSubmission)
export class AssignmentSubmissionsResolver {
  constructor(private readonly assignmentSubmissionsService: AssignmentSubmissionsService) {}

  @RequirePermissions(Perm.SUBMIT_ASSIGNMENTS)
  @Mutation(() => SubmissionUploadUrl, {
    description: 'Create a presigned URL for uploading a submission file',
  })
  createSubmissionUploadUrl(@Args('input') input: CreateSubmissionUploadInput) {
    return this.assignmentSubmissionsService.createUploadUrl(input);
  }

  @RequirePermissions(Perm.SUBMIT_ASSIGNMENTS)
  @Mutation(() => AssignmentSubmission, {
    description: 'Create an assignment submission after file upload',
  })
  createAssignmentSubmission(@Args('input') input: CreateAssignmentSubmissionInput) {
    return this.assignmentSubmissionsService.createSubmission(input);
  }

  @RequirePermissions(Perm.MANAGE_ASSIGNMENTS)
  @Mutation(() => Boolean, {
    description: 'Delete an assignment submission',
  })
  deleteAssignmentSubmission(@Args('submissionId') submissionId: string) {
    return this.assignmentSubmissionsService.deleteSubmission(submissionId);
  }

  @Query(() => AssignmentSubmission, {
    description: 'Get the current student submission for an assignment',
    nullable: true,
  })
  myAssignmentSubmission(@Args('assignmentId') assignmentId: string) {
    return this.assignmentSubmissionsService.getMySubmission(assignmentId);
  }

  @Query(() => [AssignmentSubmission], {
    description: 'Get all submissions for an assignment (teachers/admins only)',
  })
  assignmentSubmissions(@Args('assignmentId') assignmentId: string) {
    return this.assignmentSubmissionsService.getSubmissionsByAssignment(assignmentId);
  }

  @Query(() => [Student], {
    description: 'Get all students for an assignment with their submissions',
  })
  studentsForAssignment(@Args('assignmentId') assignmentId: string) {
    return this.assignmentSubmissionsService.getStudentsForAssignment(assignmentId);
  }

  @Mutation(() => SubmissionDownloadUrl, {
    description: 'Create a presigned URL for downloading a submission file',
  })
  createSubmissionDownloadUrl(@Args('fileId') fileId: string) {
    return this.assignmentSubmissionsService.createDownloadUrl(fileId);
  }
}
