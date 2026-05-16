import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NewslettersController } from './newsletters.controller';
import { NewslettersResolver } from './newsletters.resolver';
import { NewslettersService } from './newsletters.service';

@Module({
  controllers: [NewslettersController],
  providers: [
    ...(includeNestGraphQlResolvers ? [NewslettersResolver] : []),
    NewslettersService,
  ],
  imports: [PrismaModule],
})
export class NewslettersModule {}
