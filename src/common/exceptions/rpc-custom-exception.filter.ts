import { Catch, ArgumentsHost, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const rpcError: any = exception.getError();

    // Caso 1: El microservicio lanzó una RpcException estructurada con statusCode y message
    // Ejemplo: throw new RpcException({ statusCode: 409, message: 'El Usuario ya existe' })
    if (
      typeof rpcError === 'object' &&
      rpcError !== null &&
      'statusCode' in rpcError &&
      'message' in rpcError
    ) {
      const status = isNaN(+rpcError['statusCode']) ? HttpStatus.BAD_REQUEST : +rpcError['statusCode'];
      return response.status(status).json(rpcError);
    }

    // Caso 2: El error proviene del ValidationPipe del microservicio
    // NestJS Microservices ValidationPipe empaqueta los errores de validación en este formato
    if (
      typeof rpcError === 'object' &&
      rpcError !== null &&
      'status' in rpcError &&
      'message' in rpcError &&
      'error' in rpcError
    ) {
      // Intenta mapear el status code o usar 400 Bad Request como fallback
      const status = isNaN(+rpcError['status']) ? HttpStatus.BAD_REQUEST : +rpcError['status'];
      return response.status(status).json(rpcError);
    }

    // Caso 3: Fallback genérico para cualquier otro tipo de error (ej: string o estructura desconocida)
    return response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: rpcError,
    });
  }
}
