import { Controller, Get, Inject, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NATS_SERVICE } from '../config/service';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}

  @Get('mias')
  async findMine(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('horas') horas?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    const parsedOffset = offset ? Number(offset) : 0;
    const parsedHoras = horas ? Number(horas) : 24;

    return firstValueFrom(
      this.natsClient.send('notificaciones.find_by_destinatario', {
        destinatarioId: req.user.sub,
        limit: Number.isFinite(parsedLimit) ? parsedLimit : 50,
        offset: Number.isFinite(parsedOffset) ? parsedOffset : 0,
        horas: Number.isFinite(parsedHoras) ? parsedHoras : 24,
      }),
    );
  }

  @Patch('mias/:id/leida')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return firstValueFrom(
      this.natsClient.send('notificaciones.mark_as_read', {
        destinatarioId: req.user.sub,
        notificacionId: id,
      }),
    );
  }
}
