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
import { CommunicationWsAuthService } from './communication-ws-auth.service';

/** Live delivery of communication messages, typing indicators, and receipts. */
@WebSocketGateway({
  namespace: '/communication',
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
export class CommunicationSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CommunicationSocketGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly wsAuth: CommunicationWsAuthService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.wsAuth.resolveTokenFromHandshake(client.handshake);
    const userId = await this.wsAuth.resolveUserIdFromToken(token);
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

  @SubscribeMessage('joinThread')
  async handleJoinThread(@ConnectedSocket() client: Socket, @MessageBody() threadId: string) {
    const userId = client.data['userId'] as string | undefined;
    if (!userId || !threadId) return { ok: false };
    const participant = await this.prisma.threadParticipant.findFirst({
      where: { threadId, userId },
      select: { id: true },
    });
    if (!participant) return { ok: false };
    await client.join(this.threadRoom(threadId));
    return { ok: true };
  }

  @SubscribeMessage('leaveThread')
  async handleLeaveThread(@ConnectedSocket() client: Socket, @MessageBody() threadId: string) {
    if (!threadId) return { ok: false };
    await client.leave(this.threadRoom(threadId));
    return { ok: true };
  }

  @SubscribeMessage('typing')
  async handleTyping(@ConnectedSocket() client: Socket, @MessageBody() threadId: string) {
    const userId = client.data['userId'] as string | undefined;
    if (!userId || !threadId) return { ok: false };
    this.emitTyping(threadId, userId);
    return { ok: true };
  }

  emitMessageNew(threadId: string, message: unknown) {
    if (!this.server) {
      this.logger.warn('Socket server not ready');
      return;
    }
    this.server.to(this.threadRoom(threadId)).emit('thread:message.new', { threadId, message });
  }

  emitTyping(threadId: string, userId: string) {
    if (!this.server) return;
    this.server.to(this.threadRoom(threadId)).emit('thread:typing', { threadId, userId });
  }

  emitDeliveryUpdate(recipientUserId: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(this.userRoom(recipientUserId)).emit('delivery:update', payload);
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private threadRoom(threadId: string) {
    return `thread:${threadId}`;
  }
}
