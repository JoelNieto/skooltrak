import { Injectable, NgZone, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { readAccessTokenFromStorage } from '#/client-auth';

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

type Handler = (payload: ThreadMessagePayload) => void;

/**
 * Socket.IO client for the communication namespace. Mirrors the dashboard chat
 * socket but targets the `/communication` namespace and the new event names.
 */
@Injectable({ providedIn: 'root' })
export class CommunicationSocket {
  readonly #zone = inject(NgZone);
  #socket: Socket | null = null;
  readonly #joined = new Set<string>();
  readonly #handlers = new Set<Handler>();

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
      this.#zone.run(() => {
        for (const h of this.#handlers) h(payload);
      });
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

  onMessageReceived(handler: Handler): () => void {
    this.#handlers.add(handler);
    this.connect();
    return () => this.#handlers.delete(handler);
  }
}
