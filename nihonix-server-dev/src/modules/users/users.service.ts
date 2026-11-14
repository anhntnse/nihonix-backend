import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@users/entity/user.entity';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { Level } from '@levels/entity/level.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'username',
        'email',
        'full_name',
        'avatar_url',
        'language',
        'status',
        'role',
        'level_code',
        'created_at',
      ],
      relations: ['level'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'full_name',
        'avatar_url',
        'language',
        'status',
        'role',
        'level_code',
        'created_at',
      ],
      relations: ['level'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async getUserLevel(userId: string): Promise<{ user_id: string; level_code: string | null; level: Level | null }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['level'],
      select: ['id', 'level_code'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      user_id: user.id,
      level_code: user.level_code,
      level: user.level,
    };
  }

  async updateUserLevel(userId: string, levelCode: string): Promise<User> {
    // Validate level code format
    const validLevelCodes: ('N5' | 'N4' | 'N3' | 'N2' | 'N1')[] = [
      'N5',
      'N4',
      'N3',
      'N2',
      'N1',
    ];
    if (!validLevelCodes.includes(levelCode as any)) {
      throw new BadRequestException(
        `Invalid level code: ${levelCode}. Must be one of: ${validLevelCodes.join(', ')}`,
      );
    }

    // Check if level exists in database
    const level = await this.levelRepository.findOne({
      where: { code: levelCode as 'N5' | 'N4' | 'N3' | 'N2' | 'N1' },
    });

    if (!level) {
      // Get available levels from database to show in error message
      const availableLevels = await this.levelRepository.find({
        select: ['code'],
        order: { code: 'ASC' },
      });
      const availableCodes =
        availableLevels.map((l) => l.code).join(', ') || 'none';

      throw new NotFoundException(
        `Level ${levelCode} not found in database. ` +
          `Available levels: ${availableCodes || 'none (database might not be seeded)'}. ` +
          `Please run seed script to add levels to database.`,
      );
    }

    // Update user level directly using update method
    await this.userRepository.update(userId, {
      level_code: levelCode,
    });

    // Return updated user with level relation
    return this.findById(userId);
  }

  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<User> {
    await this.userRepository.update(userId, {
      avatar_url: avatarUrl,
    });

    return this.findById(userId);
  }
}
