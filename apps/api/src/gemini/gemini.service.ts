import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiRepairDiagnosis {
  problema_identificado: string;
  pasos_para_reparar: string[];
  palabras_clave_busqueda_youtube: string[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeRepair(
    description: string,
    file?: Express.Multer.File,
  ): Promise<GeminiRepairDiagnosis> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
Eres un experto técnico en reparaciones del hogar, electrónica y armado de muebles ("Fixpert-AI").
Analiza la descripción del usuario y la imagen adjunta (si existe).
Devuelve ESTRICTAMENTE un objeto JSON válido con la siguiente estructura exacta y sin bloques de markdown:
{
  "problema_identificado": "Descripción clara y concisa del daño o tarea de armado",
  "pasos_para_reparar": ["Paso 1 detallado", "Paso 2 detallado"],
  "palabras_clave_busqueda_youtube": ["frase de búsqueda 1", "frase de búsqueda 2"]
}

Descripción del usuario: "${description}"
      `.trim();

      const parts: Array<
        string | { inlineData: { data: string; mimeType: string } }
      > = [prompt];

      if (file) {
        parts.push({
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
          },
        });
      }

      const result = await model.generateContent(parts);
      const responseText = result.response.text();

      const cleanedJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed: GeminiRepairDiagnosis = JSON.parse(cleanedJson);

      if (
        !parsed.problema_identificado ||
        !Array.isArray(parsed.pasos_para_reparar) ||
        !Array.isArray(parsed.palabras_clave_busqueda_youtube)
      ) {
        throw new Error('Estructura JSON de Gemini incompleta o inválida');
      }

      return parsed;
    } catch (error) {
      this.logger.error('Error al analizar la reparación con Gemini', error);
      throw new InternalServerErrorException(
        'No se pudo procesar el diagnóstico con IA.',
      );
    }
  }
}
