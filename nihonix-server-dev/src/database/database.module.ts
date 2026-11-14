import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// import for entities
import { User } from '@users/entity/user.entity';
import { UserAuth, Session, VerificationToken } from '@auth/entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('database.host');
        const requiresSSL =
          host?.includes('neon.tech');
          // host?.includes('supabase') ||
          // host?.includes('aws.com') ||
          // host?.includes('azure.com') ||
          // host?.includes('digitalocean.com');

        return {
          type: 'postgres',
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          entities: [User, UserAuth, Session, VerificationToken],
          synchronize: configService.get('database.synchronize'),
          logging: configService.get('database.logging'),
          autoLoadEntities: true,
          ssl: requiresSSL ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
