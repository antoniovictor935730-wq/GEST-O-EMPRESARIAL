import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { LoginDto, RegisterDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email)
    if (existingUser) {
      throw new BadRequestException('Este email já está em uso.')
    }

    const password = await bcrypt.hash(dto.password, 10)
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password,
      role: dto.role,
    })

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role })

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken: token,
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.')
    }

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas.')
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role })

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken: token,
    }
  }
}
