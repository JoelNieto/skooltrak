import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateFileInput {
  @Field(() => String, { description: 'Name of the file' })
  name: string;

  @Field(() => String, { description: 'MIME type of the file' })
  mimeType: string;

  @Field(() => Int, { description: 'Size of the file in bytes' })
  size: number;

  @Field(() => String, { description: 'Storage key for the file' })
  storageKey: string;
}
