import { readAccessTokenFromStorage } from '#/client-auth';
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export type ChatMessageReceivedPayload = {
  chatId: string;
  message: {
    id: string;
    chatId: string;
    senderId?: string | null;
    content: string;
    createdAt: string;
    sender?: unknown;
  };
};

type MessageHandler = (payload: ChatMessageReceivedPayload) => void;

/** Singleton Socket.IO client for live chat message push (REST for send/history). */
@Injectable({ providedIn: 'root' })
export default class ChatSocketService {
  #socket: Socket | null = null;
  #joinedChats = new Set<string>();
  readonly #handlers = new Set<MessageHandler>();

  connect() {
    if (this.#socket?.connected) return this.#socket;
    if (typeof location === 'undefined') return null;

    const token = readAccessTokenFromStorage();
    this.#socket = io(`${location.protocol}//${location.host}`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: token ? { token } : {},
      autoConnect: true,
    });

    this.#socket.on('messageReceived', (payload: ChatMessageReceivedPayload) => {
      for (const handler of this.#handlers) {
        handler(payload);
      }
    });

    return this.#socket;
  }

  disconnect() {
    this.#socket?.disconnect();
    this.#socket = null;
    this.#joinedChats.clear();
  }

  joinChat(chatId: string) {
    if (!chatId || this.#joinedChats.has(chatId)) return;
    const socket = this.connect();
    if (!socket) return;

    socket.emit('joinChat', chatId, () => {
      this.#joinedChats.add(chatId);
    });
  }

  leaveChat(chatId: string) {
    if (!chatId || !this.#joinedChats.has(chatId)) return;
    this.#socket?.emit('leaveChat', chatId);
    this.#joinedChats.delete(chatId);
  }

  onMessageReceived(handler: MessageHandler): () => void {
    this.#handlers.add(handler);
    this.connect();
    return () => this.#handlers.delete(handler);
  }
}
