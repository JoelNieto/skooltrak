import { Field, ObjectType } from '@nestjs/graphql';

/** Minimal class group info for display (e.g. in chat participant badges) */
@ObjectType()
export class ClassGroupRef {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;
}
