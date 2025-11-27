import { JwtAuthGuard } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { CreateMessageInput } from './dto/create-message.input';
import { Message, MessageRecipient } from './entities/message.entity';
import { MessagesService } from './messages.service';

@Resolver(() => Message)
export class MessagesResolver {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Message)
  createMessage(
    @Args('createMessageInput') createMessageInput: CreateMessageInput
  ) {
    return this.messagesService.create(createMessageInput);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Message], { name: 'findMyMessages' })
  findMyMessages(@Args() args: FetchDataInput) {
    return this.messagesService.findManyBySender(args);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [MessageRecipient], { name: 'findManyMessages' })
  findManyMessages(@Args() query: FetchDataInput) {
    return this.messagesService.findMany(query);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => Int, { name: 'findManyMessagesCount' })
  findManyMessagesCount() {
    return this.messagesService.findCount();
  }

  @Query(() => Message, { name: 'message' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.messagesService.findOne(id);
  }

  @Mutation(() => Message)
  removeMessage(@Args('id', { type: () => String }) id: string) {
    return this.messagesService.remove(id);
  }
}
