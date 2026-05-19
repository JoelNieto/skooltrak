import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NewslettersController } from './newsletters.controller';
import { NewslettersService } from './newsletters.service';

@Module({
  controllers: [NewslettersController],
  providers: [
    NewslettersService,
  ],
  imports: [PrismaModule],
})
export class NewslettersModule {}
