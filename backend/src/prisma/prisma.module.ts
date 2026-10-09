import { Global, Module } from '@nestjs/common';
import { LimitesService } from './limites.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, LimitesService],
  exports: [PrismaService, LimitesService],
})
export class PrismaModule {}