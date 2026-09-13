import { Controller, Get, Query } from '@nestjs/common'
import { ReportsService } from './reports.service'

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async sales(@Query('period') period?: string) {
    return this.reportsService.sales(period)
  }

  @Get('financial')
  async financial(@Query('period') period?: string) {
    return this.reportsService.financial(period)
  }
}
