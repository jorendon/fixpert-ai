import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GeminiService } from '../gemini/gemini.service';
import { YoutubeService } from '../youtube/youtube.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('repairs')
export class RepairController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly youtubeService: YoutubeService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'fixpert-api' };
  }

  @Post('diagnose')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async diagnoseRepair(
    @Body('description') description: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!description || !description.trim()) {
      throw new BadRequestException('La descripción del problema es obligatoria.');
    }

    // 1. Diagnóstico multimodal con Gemini
    const diagnosis = await this.geminiService.analyzeRepair(description, file);

    // 2. Búsqueda de tutoriales en YouTube Data API v3
    const youtubeVideos = await this.youtubeService.searchTutorials(
      diagnosis.palabras_clave_busqueda_youtube,
    );

    // 3. Persistencia del historial en PostgreSQL mediante Prisma
    const savedQuery = await this.prismaService.repairQuery.create({
      data: {
        userDescription: description,
        imageMimeType: file?.mimetype ?? null,
        identifiedProblem: diagnosis.problema_identificado,
        repairSteps: diagnosis.pasos_para_reparar,
        youtubeKeywords: diagnosis.palabras_clave_busqueda_youtube,
        youtubeVideos: youtubeVideos as any,
      },
    });

    return {
      id: savedQuery.id,
      ...diagnosis,
      videos_recomendados: youtubeVideos,
      createdAt: savedQuery.createdAt,
    };
  }
}
