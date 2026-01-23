import { Field, InputType } from '@nestjs/graphql';
import { FileShareTargetType } from './share-file.input';

@InputType()
export class RemoveShareInput {
  @Field(() => String, { description: 'File ID for the share' })
  fileId: string;

  @Field(() => String, { description: 'Target type for the share' })
  targetType: FileShareTargetType;

  @Field(() => String, { description: 'Target ID for the share' })
  targetId: string;
}
