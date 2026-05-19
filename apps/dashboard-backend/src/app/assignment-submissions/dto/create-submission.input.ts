import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class CreateSubmissionUploadInput {
    @IsString()
  @IsNotEmpty()
  assignmentId: string;

    @IsString()
  @IsNotEmpty()
  fileName: string;

    @IsString()
  @IsNotEmpty()
  mimeType: string;
}

export class CreateAssignmentSubmissionInput {
    @IsString()
  @IsNotEmpty()
  assignmentId: string;

    @IsString()
  @IsNotEmpty()
  fileName: string;

    @IsString()
  @IsNotEmpty()
  mimeType: string;

    @IsInt()
  @Min(1)
  fileSize: number;

    @IsString()
  @IsNotEmpty()
  storageKey: string;
}
