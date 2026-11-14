import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';
@Controller('levels')
export class LevelsController {
  constructor(private readonly catalog: CatalogService) {}
  @Get()
  findAll() { return this.catalog.levels(); }
  @Get(':code')
  findByCode(@Param('code') code: string) { return this.catalog.levels(code); }
}
