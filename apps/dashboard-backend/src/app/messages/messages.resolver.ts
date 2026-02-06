import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions, User } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateMessageInput } from './dto/create-message.input';
import { Message, MessageRecipient } from './entities/message.entity';
import { MessagesService } from './messages.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_MESSAGES)
@Resolver(() => Message)
export class MessagesResolver {
  constructor(private readonly messagesService: MessagesService) {}

  @ResolveField(() => [Message], { name: 'replies' })
  getReplies(@Parent() message: Message) {
    return this.messagesService.findReplies(message.id);
  }

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => Message)
  createMessage(@Args('createMessageInput') createMessageInput: CreateMessageInput) {
    return this.messagesService.create(createMessageInput);
  }

  @Query(() => [Message], { name: 'findMyMessages' })
  findMyMessages(@Args() args: FetchDataInput) {
    return this.messagesService.findManyBySender(args);
  }

  @Query(() => [MessageRecipient], { name: 'findManyMessages' })
  findManyMessages(@Args() query: FetchDataInput) {
    return this.messagesService.findMany(query);
  }

  @Query(() => Int, { name: 'findManyMessagesCount' })
  findManyMessagesCount() {
    return this.messagesService.findCount();
  }

  @Query(() => Int, { name: 'findSentMessagesCount' })
  findSentMessagesCount() {
    return this.messagesService.findSentCount();
  }

  @Query(() => [User], { name: 'findContacts' })
  findContacts(
    @Args('queryText', { type: () => String, nullable: true, defaultValue: '' })
    queryText?: string,
  ) {
    return this.messagesService.findContacts(queryText);
  }

  @Query(() => Message, { name: 'findMessageById' })
  findMessageById(@Args('id', { type: () => String }) id: string) {
    return this.messagesService.findOne(id);
  }

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => Message)
  removeMessage(@Args('id', { type: () => String }) id: string) {
    return this.messagesService.remove(id);
  }

  @RequirePermissions(Perm.MANAGE_MESSAGES)
  @Mutation(() => MessageRecipient)
  removeMessageRecipient(@Args('id', { type: () => String }) id: string) {
    return this.messagesService.removeRecipient(id);
  }

  @Mutation(() => MessageRecipient, { nullable: true })
  markMessageAsRead(@Args('messageId', { type: () => String }) messageId: string) {
    return this.messagesService.markAsRead(messageId);
  }

  @Query(() => Int, { name: 'unreadMessagesCount' })
  unreadMessagesCount() {
    return this.messagesService.findUnreadCount();
  }
}
