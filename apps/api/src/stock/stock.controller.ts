import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { StockService } from './stock.service'

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.stockService.findAll(search)
  }

  @Get('summary')
  async getSummary() {
    return this.stockService.getSummary()
  }

  @Get('low')
  async lowStock() {
    return this.stockService.lowStock()
  }

  @Get('history')
  async history(@Query('productId') productId?: string) {
    return this.stockService.history(productId)
  }

  @Post('movement')
  async addMovement(@Body() dto: any) {
    return this.stockService.addMovement(dto)
  }
}
