import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { LevelsService } from './levels.service';
import { Level } from './entity/level.entity';

@ApiTags('Levels')
@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Japanese levels (JLPT N5-N1)' })
  @ApiOkResponse({ description: 'List of Japanese levels' })
  async findAll(): Promise<Level[]> {
    return this.levelsService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get Japanese level details by code (e.g. N5)' })
  @ApiParam({ name: 'code', description: 'Level code (N5, N4, N3, N2, N1)' })
  @ApiOkResponse({ description: 'Level details' })
  async findByCode(@Param('code') code: string): Promise<Level> {
    return this.levelsService.findByCode(code);
  }
}

