import { includeNestGraphQlResolvers } from '../nest-graphql-flags';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { RolesController } from './roles.controller';
import { RolesResolver } from './roles.resolver';
import { RolesService } from './roles.service';

@Module({
  controllers: [RolesController],
  providers: [
    ...(includeNestGraphQlResolvers ? [RolesResolver] : []),
    RolesService,
  ],
  imports: [PrismaModule],
})
export class RolesModule {}
