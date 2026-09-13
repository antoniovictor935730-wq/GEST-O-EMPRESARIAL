import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { UsersService } from './users.service'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/dto/auth.dto'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll() {
    return this.usersService.findAll()
  }
}
