import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { FilesResolver } from './files.resolver';
import { FilesService } from './files.service';

@Module({
  providers: [FilesResolver, FilesService],
  imports: [PrismaModule],
})
export class FilesModule {}
