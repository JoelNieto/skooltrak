import { includeNestGraphQlResolvers } from '../nest-graphql-flags';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsResolver } from './permissions.resolver';
import { PermissionsService } from './permissions.service';

@Module({
  controllers: [PermissionsController],
  providers: [
    ...(includeNestGraphQlResolvers ? [PermissionsResolver] : []),
    PermissionsService,
  ],
  imports: [PrismaModule],
})
export class PermissionsModule {}
