import { $Enums } from '@generated/prisma';
export enum FileShareTargetType {
  USER = 'USER',
  SCHOOL = 'SCHOOL',
  CLASS_GROUP = 'CLASS_GROUP',
  COURSE = 'COURSE',
}

export class ShareFileInput {
    fileId: string;

    targetType: FileShareTargetType;

    targetId: string;

    permission: $Enums.FilePermission;
}
