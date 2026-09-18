import { readAccessTokenFromStorage } from '#/client-auth';
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export interface ThreadMessagePayload {
  threadId: string;
  message: {
    id: string;
    threadId: string;
    senderId?: string | null;
    body: string;
    urgency?: string;
    createdAt: string;
    sender?: unknown;
  };
}

export interface DeliveryUpdatePayload {
  recipientUserId?: string;
  messageId?: string;
  channel?: string;
  status?: string;
  readAt?: string | null;
}

export interface ThreadUpdatedPayload {
  threadId: string;
  repliesAllowed?: boolean;
}

type MessageHandler = (payload: ThreadMessagePayload) => void;
type DeliveryHandler = (payload: DeliveryUpdatePayload) => void;
type ThreadUpdatedHandler = (payload: ThreadUpdatedPayload) => void;

/**
 * Socket.IO client for the `/communication` namespace. Mirrors the legacy chat
 * socket but targets the new communication gateway events.
 */
@Injectable({ providedIn: 'root' })
export class CommunicationSocket {
  #socket: Socket | null = null;
  #joined = new Set<string>();
  readonly #messageHandlers = new Set<MessageHandler>();
  readonly #deliveryHandlers = new Set<DeliveryHandler>();
  readonly #threadUpdatedHandlers = new Set<ThreadUpdatedHandler>();

  connect(): Socket | null {
    if (this.#socket?.connected) return this.#socket;
    if (typeof location === 'undefined') return null;

    const token = readAccessTokenFromStorage();
    this.#socket = io(`${location.protocol}//${location.host}/communication`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: token ? { token } : {},
      autoConnect: true,
    });

    this.#socket.on('thread:message.new', (payload: ThreadMessagePayload) => {
      for (const h of this.#messageHandlers) h(payload);
    });
    this.#socket.on('delivery:update', (payload: DeliveryUpdatePayload) => {
      for (const h of this.#deliveryHandlers) h(payload);
    });
    this.#socket.on('thread:updated', (payload: ThreadUpdatedPayload) => {
      for (const h of this.#threadUpdatedHandlers) h(payload);
    });

    return this.#socket;
  }

  disconnect() {
    this.#socket?.disconnect();
    this.#socket = null;
    this.#joined.clear();
  }

  joinThread(threadId: string) {
    if (!threadId || this.#joined.has(threadId)) return;
    const socket = this.connect();
    if (!socket) return;
    socket.emit('joinThread', threadId, () => this.#joined.add(threadId));
  }

  leaveThread(threadId: string) {
    if (!threadId || !this.#joined.has(threadId)) return;
    this.#socket?.emit('leaveThread', threadId);
    this.#joined.delete(threadId);
  }

  emitTyping(threadId: string) {
    this.#socket?.emit('typing', threadId);
  }

  onMessageReceived(handler: MessageHandler): () => void {
    this.#messageHandlers.add(handler);
    this.connect();
    return () => this.#messageHandlers.delete(handler);
  }

  onDeliveryUpdate(handler: DeliveryHandler): () => void {
    this.#deliveryHandlers.add(handler);
    this.connect();
    return () => this.#deliveryHandlers.delete(handler);
  }

  onThreadUpdated(handler: ThreadUpdatedHandler): () => void {
    this.#threadUpdatedHandlers.add(handler);
    this.connect();
    return () => this.#threadUpdatedHandlers.delete(handler);
  }
}
