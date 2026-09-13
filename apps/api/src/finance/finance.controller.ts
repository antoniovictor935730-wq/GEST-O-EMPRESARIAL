import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
import { FinanceService } from './finance.service'

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('expenses')
  async getExpenses() {
    return this.financeService.getExpenses()
  }

  @Get('revenues')
  async getRevenues() {
    return this.financeService.getRevenues()
  }

  @Get('summary')
  async getSummary() {
    return this.financeService.getSummary()
  }

  @Post('expenses')
  async createExpense(@Body() dto: any) {
    return this.financeService.createExpense(dto)
  }

  @Post('revenues')
  async createRevenue(@Body() dto: any) {
    return this.financeService.createRevenue(dto)
  }

  @Put('expenses/:id')
  async updateExpense(@Param('id') id: string, @Body() dto: any) {
    return this.financeService.updateExpense(dto, id)
  }

  @Put('revenues/:id')
  async updateRevenue(@Param('id') id: string, @Body() dto: any) {
    return this.financeService.updateRevenue(dto, id)
  }
}
