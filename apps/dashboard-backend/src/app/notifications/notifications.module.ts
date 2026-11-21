import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/** In-app notifications inbox (ASM-001-S08). */
@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
