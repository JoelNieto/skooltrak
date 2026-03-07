import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

export const CHAT_MESSAGE_RECEIVED = 'messageReceived';

@Injectable()
export class ChatPubSub {
  private readonly pubSub = new PubSub();

  get instance() {
    return this.pubSub;
  }

  publishMessageReceived(chatId: string, message: unknown) {
    this.pubSub.publish(CHAT_MESSAGE_RECEIVED, {
      messageReceived: message,
      chatId,
    });
  }

  asyncIterableIterator() {
    return this.pubSub.asyncIterableIterator(CHAT_MESSAGE_RECEIVED);
  }
}
