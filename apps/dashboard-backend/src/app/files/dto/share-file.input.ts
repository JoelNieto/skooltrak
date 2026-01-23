import { $Enums } from '@generated/prisma';
import { Field, InputType } from '@nestjs/graphql';

export enum FileShareTargetType {
  USER = 'USER',
  SCHOOL = 'SCHOOL',
  CLASS_GROUP = 'CLASS_GROUP',
  COURSE = 'COURSE',
}

@InputType()
export class ShareFileInput {
  @Field(() => String, { description: 'File ID to share' })
  fileId: string;

  @Field(() => String, { description: 'Target type for the share' })
  targetType: FileShareTargetType;

  @Field(() => String, { description: 'Target ID for the share' })
  targetId: string;

  @Field(() => String, { description: 'Permission for the share' })
  permission: $Enums.FilePermission;
}
