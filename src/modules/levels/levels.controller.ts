import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';
@Controller('levels')
@UseGuards(JwtAuthGuard)
export class LevelsController {
  constructor(private readonly catalog: CatalogService) {}
  @Get()
  findAll() { return this.catalog.levels(); }
  @Get(':code')
  findByCode(@Param('code') code: string) { return this.catalog.levels(code); }
}
