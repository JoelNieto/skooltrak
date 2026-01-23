import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FileUploadUrl {
  @Field(() => String, { description: 'Presigned upload URL' })
  uploadUrl: string;

  @Field(() => String, { description: 'Storage key for the file' })
  storageKey: string;
}
