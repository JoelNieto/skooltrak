import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SchoolLogoUploadUrl {
  @Field(() => String, { description: 'Presigned upload URL' })
  uploadUrl: string;

  @Field(() => String, { description: 'Storage key for the logo' })
  storageKey: string;
}

@ObjectType()
export class SchoolLogoDownloadUrl {
  @Field(() => String, { description: 'Presigned download URL for the logo' })
  downloadUrl: string;
}
