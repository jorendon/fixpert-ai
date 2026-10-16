import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RepairController } from './repair/repair.controller';
import { GeminiService } from './gemini/gemini.service';
import { YoutubeService } from './youtube/youtube.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [RepairController],
  providers: [GeminiService, YoutubeService, PrismaService],
})
export class AppModule {}
