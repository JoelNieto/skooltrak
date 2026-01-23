import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateFileDownloadInput {
  @Field(() => String, { description: 'File ID to download' })
  fileId: string;
}
