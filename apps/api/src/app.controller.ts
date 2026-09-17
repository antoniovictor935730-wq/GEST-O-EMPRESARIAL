import { Controller, Delete, Get } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): { message: string } {
    return { message: 'API ERP em funcionamento' }
  }

  @Delete('system/reset-data')
  async resetData() {
    return this.appService.resetOperationalData()
  }
}
