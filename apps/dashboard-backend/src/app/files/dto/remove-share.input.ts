import { FileShareTargetType } from './share-file.input';

export class RemoveShareInput {
    fileId: string;

    targetType: FileShareTargetType;

    targetId: string;
}
