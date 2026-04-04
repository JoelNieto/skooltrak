import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PublicSchoolDirectoryEntry {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  currencyCode: string;

  @Field(() => String, { nullable: true, description: 'School logo URL when set' })
  logoUrl?: string | null;
}
