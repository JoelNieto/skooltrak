import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PermissionsResolver } from './permissions.resolver';
import { PermissionsService } from './permissions.service';

@Module({
  providers: [PermissionsResolver, PermissionsService],
  imports: [PrismaModule],
})
export class PermissionsModule {}
