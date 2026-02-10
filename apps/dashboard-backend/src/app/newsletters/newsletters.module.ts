import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NewslettersResolver } from './newsletters.resolver';
import { NewslettersService } from './newsletters.service';

@Module({
  providers: [NewslettersResolver, NewslettersService],
  imports: [PrismaModule],
})
export class NewslettersModule {}
