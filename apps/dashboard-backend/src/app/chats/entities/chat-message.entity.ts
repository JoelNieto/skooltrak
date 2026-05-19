import { User } from '@/auth';
export class ChatMessage {
    id: string;

    chatId: string;

    senderId: string | null;

    sender: User | null;

    content: string;

    replyToId: string | null;

    createdAt: Date;

    deletedAt: Date | null;
}
