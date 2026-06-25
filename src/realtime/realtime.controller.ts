import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RealtimeService } from './realtime.service';

@Controller()
export class RealtimeController {
  private readonly logger = new Logger(RealtimeController.name);

  constructor(private readonly realtimeService: RealtimeService) {}

  @EventPattern('reporte.created')
  handleReporteCreated(@Payload() payload: unknown) {
    this.logger.log('Nuevo reporte → WebSocket');
    this.realtimeService.broadcast('reporte.created', payload);
  }

  @EventPattern('reporte.updated')
  handleReporteUpdated(@Payload() payload: unknown) {
    this.realtimeService.broadcast('reporte.updated', payload);
  }

  @EventPattern('alerta.created')
  handleAlertaCreated(@Payload() payload: unknown) {
    this.logger.log('Nueva alerta → WebSocket');
    this.realtimeService.broadcast('alerta.created', payload);
  }

  @EventPattern('alerta.updated')
  handleAlertaUpdated(@Payload() payload: unknown) {
    this.realtimeService.broadcast('alerta.updated', payload);
  }

  @EventPattern('evento.created')
  handleEventoCreated(@Payload() payload: unknown) {
    this.realtimeService.broadcast('evento.created', payload);
  }

  @EventPattern('evento.updated')
  handleEventoUpdated(@Payload() payload: unknown) {
    this.realtimeService.broadcast('evento.updated', payload);
  }

  @EventPattern('patrullero.position')
  handlePatrulleroPosition(@Payload() payload: unknown) {
    this.realtimeService.broadcast('patrullero.position', payload);
  }
}
