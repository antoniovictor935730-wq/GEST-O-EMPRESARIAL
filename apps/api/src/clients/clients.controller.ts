import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ClientsService } from './clients.service'

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.clientsService.findAll(search)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id)
  }

  @Post()
  async create(@Body() dto: any) {
    return this.clientsService.create(dto)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.clientsService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id)
  }
}
