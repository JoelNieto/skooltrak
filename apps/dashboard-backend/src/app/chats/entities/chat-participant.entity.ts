import { User } from '@/auth';
import { ChatParticipantRole } from '@generated/prisma';
export class ChatParticipant {
    id: string;

    chatId: string;

    userId: string;

    user: User;

    role: ChatParticipantRole;

    joinedAt: Date;

    lastReadAt: Date | null;

    createdAt: Date;

    updatedAt: Date;
}
