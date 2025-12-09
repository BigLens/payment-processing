import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { GetRootDoc, GetHealthDoc } from './doc/app.swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @GetRootDoc()
  getRoot() {
    return this.appService.getRoot();
  }

  @Get('health')
  @GetHealthDoc()
  getHealth() {
    return this.appService.getHealth();
  }
}
