import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';
import { ChatWsAuthService } from './chat-ws-auth.service';

/** Broadcasts new chat messages to authenticated Socket.IO clients in chat rooms. */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class ChatSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatSocketGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatWsAuth: ChatWsAuthService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.chatWsAuth.resolveTokenFromHandshake(client.handshake);
    const userId = await this.chatWsAuth.resolveUserIdFromToken(token);
    if (!userId) {
      this.logger.debug(`Rejecting unauthenticated socket ${client.id}`);
      client.disconnect(true);
      return;
    }

    client.data['userId'] = userId;
    await client.join(this.userRoom(userId));
    this.logger.debug(`Socket ${client.id} connected for user ${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket ${client.id} disconnected`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
    const userId = client.data['userId'] as string | undefined;
    if (!userId || !chatId) return { ok: false };

    const participant = await this.prisma.chatParticipant.findFirst({
      where: { chatId, userId },
      select: { id: true },
    });
    if (!participant) return { ok: false };

    await client.join(this.chatRoom(chatId));
    return { ok: true };
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string) {
    if (!chatId) return { ok: false };
    await client.leave(this.chatRoom(chatId));
    return { ok: true };
  }

  emitMessageReceived(chatId: string, message: unknown) {
    if (!this.server) {
      this.logger.warn('Socket server not ready');
      return;
    }
    Logger.debug(`Emitting messageReceived to chat ${chatId}`);
    this.server.to(this.chatRoom(chatId)).emit('messageReceived', { chatId, message });
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private chatRoom(chatId: string) {
    return `chat:${chatId}`;
  }
}
