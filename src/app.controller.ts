import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): string {
    return this.appService.getHello();
  }

  @Get()
  getRoot(): { message: string; version: string; timestamp: string } {
    return {
      message: 'Welcome to Nihonix API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
