import { BetterAuthGuard, User } from '@/auth';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateMessageInput } from './dto/create-message.input';
import { Message, MessageRecipient } from './entities/message.entity';
import { MessagesService } from './messages.service';

@Resolver(() => Message)
export class MessagesResolver {
  constructor(private readonly messagesService: MessagesService) {}

  @ResolveField(() => [Message], { name: 'replies' })
  getReplies(@Parent() message: Message) {
    return this.messagesService.findReplies(message.id);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => Message)
  createMessage(
    @Args('createMessageInput') createMessageInput: CreateMessageInput
  ) {
    return this.messagesService.create(createMessageInput);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [Message], { name: 'findMyMessages' })
  findMyMessages(@Args() args: FetchDataInput) {
    return this.messagesService.findManyBySender(args);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [MessageRecipient], { name: 'findManyMessages' })
  findManyMessages(@Args() query: FetchDataInput) {
    return this.messagesService.findMany(query);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => Int, { name: 'findManyMessagesCount' })
  findManyMessagesCount() {
    return this.messagesService.findCount();
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => Int, { name: 'findSentMessagesCount' })
  findSentMessagesCount() {
    return this.messagesService.findSentCount();
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => [User], { name: 'findContacts' })
  findContacts(
    @Args('queryText', { type: () => String, nullable: true, defaultValue: '' })
    queryText?: string
  ) {
    return this.messagesService.findContacts(queryText);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => Message, { name: 'findMessageById' })
  findMessageById(@Args('id', { type: () => String }) id: string) {
    return this.messagesService.findOne(id);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => Message)
  removeMessage(@Args('id', { type: () => String }) id: string) {
    return this.messagesService.remove(id);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => MessageRecipient)
  removeMessageRecipient(@Args('id', { type: () => String }) id: string) {
    return this.messagesService.removeRecipient(id);
  }

  @UseGuards(BetterAuthGuard)
  @Mutation(() => MessageRecipient, { nullable: true })
  markMessageAsRead(@Args('messageId', { type: () => String }) messageId: string) {
    return this.messagesService.markAsRead(messageId);
  }

  @UseGuards(BetterAuthGuard)
  @Query(() => Int, { name: 'unreadMessagesCount' })
  unreadMessagesCount() {
    return this.messagesService.findUnreadCount();
  }
}
