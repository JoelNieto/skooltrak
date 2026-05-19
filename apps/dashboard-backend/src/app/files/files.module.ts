import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
  ],
  imports: [PrismaModule],
})
export class FilesModule {}
