import { ArgsType, Field } from '@nestjs/graphql';
import { FetchDataInput } from '../../fetch-data.input';

@ArgsType()
export class FetchCourseFilesInput extends FetchDataInput {
  @Field(() => String, { description: 'Course ID' })
  courseId: string;
}
