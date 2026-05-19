import { User } from '@/auth';
import { ChatType } from '@generated/prisma';
import { ChatParticipant } from './chat-participant.entity';

export class Chat {
    id: string;

    organizationId: string;

    name: string | null;

    type: ChatType;

    courseId: string | null;

    assignmentId: string | null;

    classGroupId: string | null;

    createdById: string | null;

    createdBy: User | null;

    participants: ChatParticipant[];

    createdAt: Date;

    updatedAt: Date;

    deletedAt: Date | null;
}
