import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  controllers: [PermissionsController],
  providers: [
    PermissionsService,
  ],
  imports: [PrismaModule],
})
export class PermissionsModule {}
