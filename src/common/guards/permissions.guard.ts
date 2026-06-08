import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Si no hay usuario o permisos en el payload, rechazar
    if (!user || !user.permisos) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    // Verificar si el usuario tiene al menos uno de los permisos requeridos (o todos, según la lógica de negocio)
    // Aquí verificamos que tenga TODOS los permisos requeridos
    const hasPermission = () => requiredPermissions.every(permission => user.permisos.includes(permission));

    if (!hasPermission()) {
      throw new ForbiddenException('No tienes permisos para acceder a este recurso');
    }

    return true;
  }
}
