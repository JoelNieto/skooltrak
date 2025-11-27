import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class FetchDataInput {
  @Field(() => Int, { nullable: true })
  skip?: number;

  @Field(() => Int, { nullable: true })
  take?: number;

  @Field(() => String, { nullable: true })
  orderBy?: any;
}
