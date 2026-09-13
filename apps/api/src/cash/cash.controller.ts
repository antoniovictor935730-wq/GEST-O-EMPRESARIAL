import { Body, Controller, Get, Post } from '@nestjs/common'
import { CashService } from './cash.service'

@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('summary')
  async getSummary() {
    return this.cashService.getSummary()
  }

  @Post('register')
  async register(@Body() dto: any) {
    return this.cashService.createRegister(dto)
  }

  @Post('movement')
  async movement(@Body() dto: any) {
    return this.cashService.addMovement(dto)
  }
}
