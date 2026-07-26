import { Module } from '@nestjs/common';
import { ImportService } from './imports.service';
import { ImportsController } from './imports.controller';
import { PrismaModule } from '../prisma.module';
import { AuthModule } from '@/auth';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ImportsController],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportsModule {}
