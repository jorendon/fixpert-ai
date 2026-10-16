import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { GeminiService, GeminiRepairDiagnosis } from './gemini.service';

const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-gemini-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería retornar un JSON estricto con diagnóstico, pasos y keywords cuando recibe texto e imagen', async () => {
    const mockExpectedResponse: GeminiRepairDiagnosis = {
      problema_identificado: 'Bisagra de puerta de gabinete desajustada',
      pasos_para_reparar: [
        'Ajustar el tornillo central de profundidad con un destornillador Phillips',
        'Nivelar la puerta usando el tornillo lateral',
      ],
      palabras_clave_busqueda_youtube: [
        'como ajustar bisagra cazoleta mueble cocina',
        'reparar puerta gabinete caida',
      ],
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockExpectedResponse),
      },
    });

    const mockFile = {
      buffer: Buffer.from('fake-image-binary'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    const result = await service.analyzeRepair(
      'La puerta de la alacena no cierra bien y roza abajo',
      mockFile,
    );

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockGenerateContent).toHaveBeenCalledWith([
      expect.stringContaining('La puerta de la alacena no cierra bien y roza abajo'),
      {
        inlineData: {
          data: Buffer.from('fake-image-binary').toString('base64'),
          mimeType: 'image/jpeg',
        },
      },
    ]);
    expect(result).toEqual(mockExpectedResponse);
  });

  it('debería lanzar InternalServerErrorException si Gemini devuelve un JSON inválido', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Respuesta no JSON inválida',
      },
    });

    await expect(
      service.analyzeRepair('Mi silla está rota'),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
