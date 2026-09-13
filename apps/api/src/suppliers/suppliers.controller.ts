import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { SuppliersService } from './suppliers.service'

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.suppliersService.findAll(search)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id)
  }

  @Post()
  async create(@Body() dto: any) {
    return this.suppliersService.create(dto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.suppliersService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.suppliersService.remove(id)
  }
}
