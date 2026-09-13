import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '../dto/auth.dto'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    if (!user || !user.role) {
      throw new ForbiddenException('Utilizador sem permissão válida.')
    }

    const hasRole = requiredRoles.some((role) => user.role === role)

    if (!hasRole) {
      throw new ForbiddenException('Não tem permissão para aceder a este recurso.')
    }

    return true
  }
}
