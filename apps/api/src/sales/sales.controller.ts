import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { SalesService } from './sales.service'

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.salesService.findAll(search)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.salesService.findOne(id)
  }

  @Post()
  async create(@Body() dto: any) {
    return this.salesService.create(dto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.salesService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.salesService.remove(id)
  }
}
