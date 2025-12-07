import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class FetchDataInput {
  @Field(() => Int, { nullable: true, description: 'Skip' })
  skip?: number;

  @Field(() => Int, { nullable: true, description: 'Take' })
  take?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Order by',
    defaultValue: 'name',
  })
  orderBy?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Order direction',
    defaultValue: 'asc',
  })
  orderDirection: 'asc' | 'desc';

  @Field(() => String, { nullable: true, description: 'School ID' })
  schoolId?: string;

  @Field(() => String, {
    nullable: true,
    defaultValue: '',
    description: 'Search query',
  })
  search?: string;
}
