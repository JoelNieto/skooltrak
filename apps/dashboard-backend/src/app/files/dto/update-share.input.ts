import { $Enums } from '@generated/prisma';
import { FileShareTargetType } from './share-file.input';

export class UpdateShareInput {
    fileId: string;

    targetType: FileShareTargetType;

    targetId: string;

    permission: $Enums.FilePermission;
}
