import { Controller, Get, Post, Body, Param, Inject, UseGuards, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateAlertaDto } from './dto/update-alerta.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { NATS_SERVICE } from '../config/service';

@Controller('alertas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertasController {
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}

  @Get()
  @RequirePermissions('eventos:leer')
  findAll() {
    return this.natsClient.send('alertas.findAll', {});
  }

  @Post(':id/reconocer')
  @RequirePermissions('eventos:gestionar')
  reconocer(@Param('id') id: string, @Req() req: any) {
    const updateDto: UpdateAlertaDto = {
      id,
      estado: 'reconocida',
      operadorId: req.user.id,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }

  @Post(':id/cerrar')
  @RequirePermissions('eventos:gestionar')
  cerrar(
    @Param('id') id: string,
    @Body() body: { notas?: string; falsaAlarma?: boolean },
    @Req() req: any,
  ) {
    const updateDto: UpdateAlertaDto = {
      id,
      estado: body.falsaAlarma ? 'falsa_alarma' : 'cerrada',
      operadorId: req.user.id,
      notas: body.notas,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }
}
