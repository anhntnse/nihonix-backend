import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from './entity/level.entity';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
  ) {}

  async findAll(): Promise<Level[]> {
    return this.levelRepository.find({
      order: { code: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<Level> {
    const level = await this.levelRepository.findOne({
      where: { code: code.toUpperCase() as 'N5' | 'N4' | 'N3' | 'N2' | 'N1' },
    });

    if (!level) {
      throw new NotFoundException(`Level with code ${code} not found`);
    }

    return level;
  }
}

