import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateFileUploadInput {
  @Field(() => String, { description: 'Course ID for the upload' })
  courseId: string;

  @Field(() => String, { description: 'Original file name' })
  fileName: string;

  @Field(() => String, { description: 'MIME type of the file' })
  mimeType: string;
}
