import { includeNestGraphQlResolvers } from '../nest-graphql-flags';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { UsersController } from './users.controller';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    ...(includeNestGraphQlResolvers ? [UsersResolver] : []),
    UsersService,
  ],
  imports: [PrismaModule],
})
export class UsersModule {}
