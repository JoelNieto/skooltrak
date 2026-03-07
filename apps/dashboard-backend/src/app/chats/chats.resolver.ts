import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { AddChatParticipantsInput } from './dto/add-chat-participants.input';
import { ChatMessagesInput } from './dto/chat-messages.input';
import { CreateContextualChatInput } from './dto/create-contextual-chat.input';
import { CreateGroupChatInput } from './dto/create-group-chat.input';
import { SendMessageInput } from './dto/send-message.input';
import { ChatsService } from './chats.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_MESSAGES)
@Resolver(() => Chat)
export class ChatsResolver {
  constructor(private readonly chatsService: ChatsService) {}

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => Chat)
  createDirectChat(@Args('recipientId', { type: () => String }) recipientId: string) {
    return this.chatsService.createDirectChat(recipientId);
  }

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => Chat)
  createGroupChat(@Args('input') input: CreateGroupChatInput) {
    return this.chatsService.createGroupChat(input);
  }

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => Chat)
  createContextualChat(@Args('input') input: CreateContextualChatInput) {
    return this.chatsService.createContextualChat(input);
  }

  @Query(() => [Chat], { name: 'myChats' })
  myChats() {
    return this.chatsService.myChats();
  }

  @Query(() => Chat, { name: 'chat', nullable: true })
  chat(@Args('id', { type: () => String }) id: string) {
    return this.chatsService.chat(id);
  }

  @Query(() => [ChatMessage], { name: 'chatMessages' })
  chatMessages(@Args('input') input: ChatMessagesInput) {
    return this.chatsService.chatMessages(input);
  }

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => ChatMessage)
  sendMessage(@Args('input') input: SendMessageInput) {
    return this.chatsService.sendMessage(input);
  }

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => Chat)
  addChatParticipants(@Args('input') input: AddChatParticipantsInput) {
    return this.chatsService.addChatParticipants(input);
  }

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => Boolean)
  async leaveChat(@Args('chatId', { type: () => String }) chatId: string) {
    await this.chatsService.leaveChat(chatId);
    return true;
  }

  @Mutation(() => ChatParticipant, { nullable: true })
  markChatRead(@Args('chatId', { type: () => String }) chatId: string) {
    return this.chatsService.markChatRead(chatId);
  }

  @Query(() => Int, { name: 'chatUnreadCount' })
  chatUnreadCount() {
    return this.chatsService.unreadCount();
  }
}
