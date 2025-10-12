import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class FetchDataInput {
  @Field(() => Int, { description: 'Skip', nullable: true })
  skip?: number;

  @Field(() => Int, { description: 'Take', nullable: true })
  take?: number;

  @Field(() => String, { description: 'Teacher ID', nullable: true })
  teacherId?: string;

  @Field(() => String, { description: 'School ID', nullable: true })
  schoolId?: string;

  @Field(() => String, { description: 'Organization ID', nullable: true })
  organizationId?: string;
}
