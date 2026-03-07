import { User } from '@/auth';
import { ChatType } from '@generated/prisma';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ChatParticipant } from './chat-participant.entity';

registerEnumType(ChatType, { name: 'ChatType' });

@ObjectType()
export class Chat {
  @Field(() => String)
  id: string;

  @Field(() => String)
  organizationId: string;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => ChatType)
  type: ChatType;

  @Field(() => String, { nullable: true })
  courseId: string | null;

  @Field(() => String, { nullable: true })
  assignmentId: string | null;

  @Field(() => String, { nullable: true })
  classGroupId: string | null;

  @Field(() => String, { nullable: true })
  createdById: string | null;

  @Field(() => User, { nullable: true })
  createdBy: User | null;

  @Field(() => [ChatParticipant])
  participants: ChatParticipant[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null;
}
