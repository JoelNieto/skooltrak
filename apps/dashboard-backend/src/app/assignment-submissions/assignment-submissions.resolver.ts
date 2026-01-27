import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '@/auth';
import { AssignmentSubmissionsService } from './assignment-submissions.service';
import {
  CreateAssignmentSubmissionInput,
  CreateSubmissionUploadInput,
} from './dto/create-submission.input';
import {
  AssignmentSubmission,
  SubmissionUploadUrl,
} from './entities/assignment-submission.entity';
import { Student } from '../students/entities/student.entity';

@Resolver(() => AssignmentSubmission)
@UseGuards(JwtAuthGuard)
export class AssignmentSubmissionsResolver {
  constructor(
    private readonly assignmentSubmissionsService: AssignmentSubmissionsService
  ) {}

  @Mutation(() => SubmissionUploadUrl, {
    description: 'Create a presigned URL for uploading a submission file',
  })
  createSubmissionUploadUrl(
    @Args('input') input: CreateSubmissionUploadInput
  ) {
    return this.assignmentSubmissionsService.createUploadUrl(input);
  }

  @Mutation(() => AssignmentSubmission, {
    description: 'Create an assignment submission after file upload',
  })
  createAssignmentSubmission(
    @Args('input') input: CreateAssignmentSubmissionInput
  ) {
    return this.assignmentSubmissionsService.createSubmission(input);
  }

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

import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
class SubmissionDownloadUrl {
  @Field(() => String, { description: 'Presigned URL for downloading the file' })
  downloadUrl: string;
}
