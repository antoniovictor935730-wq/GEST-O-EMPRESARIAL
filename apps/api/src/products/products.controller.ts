import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.productsService.findAll(search)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id)
  }

  @Post()
  async create(@Body() dto: any) {
    return this.productsService.create(dto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.productsService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id)
  }
}
