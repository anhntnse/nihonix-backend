import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AiGenerationRequest} from './ai-request.entity';
import {AiRequestService} from './ai-request.service';
import { ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { AiJsonParserService } from './services/ai-json-parser.service';
import { AiGenerationService } from './services/ai-generation.service';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports:[TypeOrmModule.forFeature([AiGenerationRequest])],
  controllers: [AiController],
  providers: [
    ConfigService,
    AiService,
    AiRequestService,
    AiJsonParserService,
    // Provide AiGenerationService with GeminiProvider as default provider
    {
      provide: AiGenerationService,
      useFactory: (geminiProvider: GeminiProvider, configService: ConfigService) => {
        return new AiGenerationService(geminiProvider, configService);
      },
      inject: [GeminiProvider, ConfigService],
    },
    OpenRouterProvider,
    GeminiProvider,
  ],
  exports: [
    AiService,
    AiRequestService,
    AiJsonParserService,
    AiGenerationService,
    OpenRouterProvider,
    GeminiProvider,
  ],
})
export class AiModule {}

