import { ChatType } from '@generated/prisma';
export class CreateContextualChatInput {
    contextType: ChatType;

    contextId: string;
}
