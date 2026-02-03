import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SchoolLogoUploadInput {
  @Field(() => String, { description: 'School ID for the logo upload' })
  schoolId: string;

  @Field(() => String, { description: 'MIME type of the image' })
  mimeType: string;
}
