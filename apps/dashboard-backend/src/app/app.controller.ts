import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@/auth';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @AllowAnonymous()
  @Get()
  getData() {
    return this.appService.getData();
  }
}
