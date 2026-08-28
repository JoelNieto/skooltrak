import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CommunicationController } from './communication.controller';
import { CommunicationDeliveryService } from './communication-delivery.service';
import { CommunicationRetentionService } from './communication-retention.service';
import { CommunicationService } from './communication.service';
import { CommunicationSocketGateway } from './communication-socket.gateway';
import { CommunicationWsAuthService } from './communication-ws-auth.service';
import { TranslationService } from './translation.service';

@Module({
  controllers: [CommunicationController],
  imports: [PrismaModule],
  providers: [
    CommunicationService,
    CommunicationDeliveryService,
    CommunicationRetentionService,
    CommunicationSocketGateway,
    CommunicationWsAuthService,
    TranslationService,
  ],
  exports: [CommunicationService, CommunicationDeliveryService],
})
export class CommunicationModule {}
