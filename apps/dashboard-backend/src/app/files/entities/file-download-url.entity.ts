import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FileDownloadUrl {
  @Field(() => String, { description: 'Presigned download URL' })
  downloadUrl: string;
}
