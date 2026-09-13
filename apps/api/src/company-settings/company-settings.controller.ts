import { Body, Controller, Get, Post, Put } from '@nestjs/common'
import { CompanySettingsService } from './company-settings.service'

@Controller('company-settings')
export class CompanySettingsController {
  constructor(private readonly service: CompanySettingsService) {}

  @Get()
  async find() {
    return this.service.findOrCreateDefault()
  }

  @Post()
  async create(@Body() dto: any) {
    return this.service.create(dto)
  }

  @Put()
  async update(@Body() dto: any) {
    return this.service.update(dto)
  }
}
