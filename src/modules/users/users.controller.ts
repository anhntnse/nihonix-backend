import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateLearningSettingsDto } from './dto/learning-settings.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserLevelDto } from './dto/update-user-level.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UserLevelResponseDto } from './dto/user-level-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { UserRole } from '@enums/user-role.enum';
import { CloudinaryService } from '@upload/cloudinary.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Patch('me/profile')
  updateMyProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Get('me/settings')
  getMySettings(@Request() req) { return this.usersService.getSettings(req.user.id); }

  @Patch('me/settings')
  updateMySettings(@Request() req, @Body() dto: UpdateLearningSettingsDto) {
    return this.usersService.updateSettings(req.user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiOkResponse({ description: 'List of users retrieved' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ description: 'User retrieved' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) throw new ForbiddenException('You can only view your own profile');
    return this.usersService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile (Self or Admin)' })
  @ApiOkResponse({ description: 'User updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    // Admin can update anyone, users can only update themselves
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (req.user.role !== UserRole.ADMIN && (updateUserDto.status !== undefined || updateUserDto.email !== undefined)) {
      throw new ForbiddenException('Email and account status require a separate verified account operation');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user account (Self or Admin)' })
  @ApiNoContentResponse({ description: 'User deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    // Admin can delete anyone, users can only delete themselves
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }
    const user = await this.usersService.findById(id);
    if (user.avatar_url) await this.cloudinaryService.deleteAvatar(id);
    await this.usersService.remove(id);
  }

  @Get('me/level')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user level information' })
  @ApiOkResponse({ 
    description: 'User level information retrieved',
    type: UserLevelResponseDto 
  })
  async getMyLevel(@Request() req): Promise<UserLevelResponseDto> {
    return this.usersService.getUserLevel(req.user.id);
  }

  @Patch('me/level')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user level' })
  @ApiOkResponse({ description: 'User level updated successfully' })
  async updateMyLevel(
    @Body() updateUserLevelDto: UpdateUserLevelDto,
    @Request() req,
  ) {
    return this.usersService.updateUserLevel(
      req.user.id,
      updateUserLevelDto.level_code,
    );
  }

  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload avatar for current user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image file',
    type: UploadAvatarDto,
  })
  @ApiOkResponse({ description: 'Avatar uploaded successfully' })
  @ApiBadRequestResponse({ description: 'Invalid file or file too large' })
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new ForbiddenException('No file uploaded');
    }

    const uploadResult = await this.cloudinaryService.uploadAvatar(
      file,
      req.user.id,
    );

    await this.usersService.updateAvatarUrl(
      req.user.id,
      uploadResult.secure_url,
    );

    return {
      message: 'Avatar uploaded successfully',
      avatar_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
  }
}
