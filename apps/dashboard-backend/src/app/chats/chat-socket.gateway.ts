import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

/** Broadcasts new chat messages to Socket.IO clients (browser uses socket.io-client). */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class ChatSocketGateway {
  private readonly logger = new Logger(ChatSocketGateway.name);

  @WebSocketServer()
  server!: Server;

  emitMessageReceived(chatId: string, message: unknown) {
    if (!this.server) {
      this.logger.warn('Socket server not ready');
      return;
    }
    this.server.emit('messageReceived', { chatId, message });
  }
}
