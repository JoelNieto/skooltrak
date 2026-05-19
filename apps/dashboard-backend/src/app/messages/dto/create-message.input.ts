export class CreateMessageInput {
    subject: string;

    content: string;

    recipientIds: string[];

    parentMessageId?: string;
}
