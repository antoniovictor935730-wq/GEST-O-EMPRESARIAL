import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { CategoriesService } from './categories.service'

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    return this.categoriesService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id)
  }

  @Post()
  async create(@Body() dto: any) {
    return this.categoriesService.create(dto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.categoriesService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id)
  }
}
