import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { EmployeesService } from './employees.service'

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.employeesService.findAll(search)
  }

  @Get('payroll/summary')
  async payroll(@Query('month') month?: string) {
    return this.employeesService.getPayroll(month)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id)
  }

  @Post()
  async create(@Body() dto: any) {
    return this.employeesService.create(dto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.employeesService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.employeesService.remove(id)
  }
}
