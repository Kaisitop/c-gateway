import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
    this.logger.log('Canal WebSocket /realtime listo');
  }

  broadcast(event: string, payload: unknown) {
    if (!this.server) {
      this.logger.warn(`WebSocket no inicializado; evento ${event} descartado`);
      return;
    }

    this.server.emit(event, payload);
    this.logger.debug(`Evento ${event} enviado a clientes conectados`);
  }
}
