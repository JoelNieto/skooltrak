import { Args, Resolver, Subscription } from '@nestjs/graphql';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatPubSub } from './chat-pubsub';

@Resolver()
export class ChatsSubscriptionResolver {
  constructor(private readonly chatPubSub: ChatPubSub) {}

  @Subscription(() => ChatMessage, {
    name: 'messageReceived',
    filter: (payload: { chatId: string }, variables: { chatId?: string }) => {
      if (variables.chatId) {
        return payload.chatId === variables.chatId;
      }
      return true;
    },
  })
  messageReceived(@Args('chatId', { type: () => String, nullable: true }) _chatId?: string) {
    return this.chatPubSub.asyncIterableIterator();
  }
}
