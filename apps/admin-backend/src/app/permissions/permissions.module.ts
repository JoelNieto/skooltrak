import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PermissionsResolver } from './permissions.resolver';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [PrismaModule],
  providers: [PermissionsResolver, PermissionsService],
})
export class PermissionsModule {}
