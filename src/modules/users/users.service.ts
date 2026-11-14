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
import { DEFAULT_LEARNING_SETTINGS, UpdateLearningSettingsDto } from './dto/learning-settings.dto';

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
        'email_verified_at',
        'learning_settings',
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
        'email_verified_at',
        'learning_settings',
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

    const changes = Object.fromEntries(Object.entries(updateUserDto).filter(([, value]) => value !== undefined && value !== null));
    if (typeof changes.username === 'string') {
      changes.username = changes.username.trim();
      if (changes.username.length < 3 || changes.username.length > 50) throw new BadRequestException('Username must be 3–50 characters');
    }
    if (typeof changes.full_name === 'string') changes.full_name = changes.full_name.trim();
    if (changes.email && changes.email !== user.email) user.email_verified_at = null;
    Object.assign(user, changes);
    try { await this.userRepository.save(user); }
    catch (error) {
      if (error.code === '23505') throw new BadRequestException('Username or email already exists');
      throw error;
    }
    return this.findById(id);
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

  async getSettings(userId: string) {
    const user = await this.findById(userId);
    return { ...DEFAULT_LEARNING_SETTINGS, ...user.learning_settings };
  }

  async updateSettings(userId: string, dto: UpdateLearningSettingsDto) {
    if (Object.values(dto).some(value => value === null)) throw new BadRequestException('Settings cannot be null');
    return this.userRepository.manager.transaction(async manager => {
      const repo = manager.getRepository(User);
      const user = await repo.findOne({ where: { id: userId }, lock: { mode: 'pessimistic_write' } });
      if (!user) throw new NotFoundException('User not found');
      const changes = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
      user.learning_settings = { ...DEFAULT_LEARNING_SETTINGS, ...user.learning_settings, ...changes };
      await repo.save(user);
      return user.learning_settings;
    });
  }

  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<User> {
    await this.userRepository.update(userId, {
      avatar_url: avatarUrl,
    });

    return this.findById(userId);
  }
}
