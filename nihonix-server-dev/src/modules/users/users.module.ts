import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entity/user.entity';
import { Level } from '@levels/entity/level.entity';
import { UploadModule } from '@upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Level]),
    UploadModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
