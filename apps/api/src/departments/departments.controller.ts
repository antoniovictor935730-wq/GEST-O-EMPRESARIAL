import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { DepartmentsService } from './departments.service'

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll() {
    return this.departmentsService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id)
  }

  @Post()
  async create(@Body() dto: any) {
    return this.departmentsService.create(dto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.departmentsService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.departmentsService.remove(id)
  }
}
