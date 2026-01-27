import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

@InputType()
export class CreateSubmissionUploadInput {
  @Field(() => String, { description: 'Assignment ID' })
  @IsString()
  @IsNotEmpty()
  assignmentId: string;

  @Field(() => String, { description: 'File name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @Field(() => String, { description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}

@InputType()
export class CreateAssignmentSubmissionInput {
  @Field(() => String, { description: 'Assignment ID' })
  @IsString()
  @IsNotEmpty()
  assignmentId: string;

  @Field(() => String, { description: 'File name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @Field(() => String, { description: 'MIME type of the file' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @Field(() => Int, { description: 'Size of the file in bytes' })
  @IsInt()
  @Min(1)
  fileSize: number;

  @Field(() => String, { description: 'Storage key from the upload' })
  @IsString()
  @IsNotEmpty()
  storageKey: string;
}
