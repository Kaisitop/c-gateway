import { Controller, Get, Post, Patch, Body, Param, Inject, UseGuards, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateAlertaDto } from './dto/update-alerta.dto';
import { CerrarAlertaPatrulleroDto } from './dto/cerrar-alerta-patrullero.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { NATS_SERVICE } from '../config/service';

@Controller('alertas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertasController {
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}

  @Get()
  @RequirePermissions('alertas:read', 'alertas:read_all')
  findAll() {
    return this.natsClient.send('alertas.findAll', {});
  }

  @Get(':id')
  @RequirePermissions('alertas:read', 'alertas:read_all')
  findOne(@Param('id') id: string) {
    return this.natsClient.send('alertas.findOne', { id });
  }

  @Post(':id/reconocer')
  @RequirePermissions('alertas:update_status')
  reconocer(@Param('id') id: string, @Req() req: any) {
    const updateDto: UpdateAlertaDto = {
      id,
      estado: 'reconocida',
      operadorId: req.user.sub,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }

  @Patch(':id/cerrar')
  @RequirePermissions('alertas:update_status')
  cerrarPatrullero(
    @Param('id') id: string,
    @Body() body: CerrarAlertaPatrulleroDto,
    @Req() req: any,
  ) {
    const updateDto: UpdateAlertaDto & {
      comentarioCierre?: string;
      evidenciaUrls?: string;
    } = {
      id,
      estado: body.estado ?? 'completada',
      operadorId: req.user.sub,
      comentarioCierre: body.comentarioCierre,
      evidenciaUrls: body.evidenciaUrls?.length
        ? JSON.stringify(body.evidenciaUrls)
        : undefined,
      notas: body.notas ?? body.comentarioCierre,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }

  @Post(':id/cerrar')
  @RequirePermissions('alertas:update_status')
  cerrar(
    @Param('id') id: string,
    @Body() body: { notas?: string; falsaAlarma?: boolean },
    @Req() req: any,
  ) {
    const updateDto: UpdateAlertaDto = {
      id,
      estado: body.falsaAlarma ? 'falsa_alarma' : 'cerrada',
      operadorId: req.user.sub,
      notas: body.notas,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }
}
