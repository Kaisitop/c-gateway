import {
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';
import { envs } from '../config/envs';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: envs.corsOrigins,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly realtimeService: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        throw new UnauthorizedException('Token requerido');
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      this.logger.log(`Cliente conectado: ${payload.sub ?? 'unknown'}`);
    } catch {
      this.logger.warn('Conexión WebSocket rechazada: token inválido');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    this.logger.log(`Cliente desconectado${userId ? `: ${userId}` : ''}`);
  }
}
