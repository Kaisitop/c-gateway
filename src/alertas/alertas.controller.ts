import { Controller, Get, Post, Patch, Body, Param, Inject, UseGuards, Req, Query, ForbiddenException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UpdateAlertaDto } from './dto/update-alerta.dto';
import { CerrarAlertaPatrulleroDto } from './dto/cerrar-alerta-patrullero.dto';
import { ReconocerAlertaDto } from './dto/reconocer-alerta.dto';
import { AtenderAlertaCampoDto } from './dto/atender-alerta-campo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { NATS_SERVICE } from '../config/service';

@Controller('alertas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertasController {
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}

  @Public()
  @Get('mapa/public')
  findForMapPublic(@Query('horas') horas?: string) {
    const parsed = horas != null ? Number.parseInt(horas, 10) : 24;
    const windowHours = Number.isFinite(parsed) ? parsed : 24;
    return this.natsClient.send('alertas.findForMap', { horas: windowHours });
  }

  @Get('mapa')
  @RequirePermissions('alertas:read', 'alertas:read_all')
  findForMap(@Query('horas') horas?: string) {
    const parsed = horas != null ? Number.parseInt(horas, 10) : 24;
    const windowHours = Number.isFinite(parsed) ? parsed : 24;
    return this.natsClient.send('alertas.findForMap', { horas: windowHours });
  }

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
  reconocer(
    @Param('id') id: string,
    @Body() body: ReconocerAlertaDto,
    @Req() req: { user: { sub: string } },
  ) {
    const updateDto: UpdateAlertaDto = {
      id,
      estado: 'reconocida',
      operadorId: req.user.sub,
      notas: body?.notas,
      evidenciaUrls: body?.evidenciaUrls?.length
        ? JSON.stringify(body.evidenciaUrls)
        : undefined,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }

  /** Patrullero: marca que va en camino hacia la alerta. */
  @Post(':id/en-camino')
  @RequirePermissions('alertas:update_status')
  enCamino(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
  ) {
    const updateDto: UpdateAlertaDto = {
      id,
      estado: 'en_proceso',
      operadorId: req.user.sub,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }

  /** Patrullero: reconoce en campo con informe y evidencia (no cierra el caso). */
  @Post(':id/atender-campo')
  @RequirePermissions('alertas:update_status')
  atenderCampo(
    @Param('id') id: string,
    @Body() body: AtenderAlertaCampoDto,
    @Req() req: any,
  ) {
    const updateDto: UpdateAlertaDto = {
      id,
      estado: 'reconocida',
      operadorId: req.user.sub,
      comentarioCierre: body.comentarioCierre,
      evidenciaUrls: body.evidenciaUrls?.length
        ? JSON.stringify(body.evidenciaUrls)
        : undefined,
      notas: body.comentarioCierre,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }

  @Patch(':id/cerrar')
  @RequirePermissions('alertas:update_status')
  cerrarPatrullero(
    @Param('id') id: string,
    @Body() body: CerrarAlertaPatrulleroDto,
    @Req() req: { user: { sub: string; rol?: string } },
  ) {
    const rol = String(req.user?.rol ?? '').toLowerCase();
    if (rol === 'policia') {
      throw new ForbiddenException(
        'El patrullero no puede cerrar alertas. Use atender-campo y deje el cierre al operador.',
      );
    }
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
    @Req() req: { user: { sub: string; rol?: string } },
  ) {
    const rol = String(req.user?.rol ?? '').toLowerCase();
    if (rol === 'policia') {
      throw new ForbiddenException(
        'El patrullero no puede cerrar alertas. Envíe el informe de campo y el operador cerrará el caso.',
      );
    }
    const updateDto: UpdateAlertaDto = {
      id,
      estado: body.falsaAlarma ? 'falsa_alarma' : 'cerrada',
      operadorId: req.user.sub,
      notas: body.notas,
    };
    return this.natsClient.send('alertas.updateStatus', updateDto);
  }
}
