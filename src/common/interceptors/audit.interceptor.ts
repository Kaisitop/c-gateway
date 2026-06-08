import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../../config/service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(@Inject(NATS_SERVICE) private client: ClientProxy) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    
    // Solo registrar métodos que mutan el estado (o según lo necesites)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(() => {
          const user = request.user; // Si está autenticado con JWT
          const ipAddress = request.ip || request.connection.remoteAddress || '127.0.0.1';
          const userAgent = request.headers['user-agent'] || 'Unknown';
          const path = request.originalUrl;
          
          this.client.emit('audit.log.create', {
            usuarioId: user?.sub, // ID del usuario si está autenticado
            accion: `API_${method}_${path}`.substring(0, 100), // Max 100 chars
            ipAddress,
            userAgent,
            metadata: { body: request.body }
          });
        }),
      );
    }
    
    return next.handle();
  }
}
