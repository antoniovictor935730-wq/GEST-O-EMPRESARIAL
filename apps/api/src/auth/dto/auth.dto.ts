import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator'

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  HR = 'HR',
  SELLER = 'SELLER',
  CASHIER = 'CASHIER',
}

export class RegisterDto {
  @IsNotEmpty()
  name!: string

  @IsEmail()
  email!: string

  @IsNotEmpty()
  @MinLength(6)
  password!: string

  @IsEnum(UserRole)
  role: UserRole = UserRole.ADMIN
}

export class LoginDto {
  @IsEmail()
  email!: string

  @IsNotEmpty()
  password!: string
}
