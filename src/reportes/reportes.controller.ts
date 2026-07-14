import { Controller, Get, Post, Put, Body, Param, Inject, UseGuards, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { UpdateReporteStatusDto } from './dto/update-reporte-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { NATS_SERVICE } from '../config/service';

@Controller('reportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportesController {
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}

  @Post()
  @RequirePermissions('reportes:create')
  create(@Body() createReporteDto: CreateReporteDto, @Req() req: any) {
    createReporteDto.usuarioId = req.user.sub;
    return this.natsClient.send('reportes.create', createReporteDto);
  }

  @Get()
  @RequirePermissions(
    'reportes:read_anon',
    'reportes:read_all',
    'reportes:read_own',
  )
  findAll(@Req() req: any) {
    const payload: { usuarioId?: string } = {};
    const permisos: string[] = req.user?.permisos ?? [];

    if (
      req.user?.rol === 'Ciudadano' ||
      (permisos.includes('reportes:read_own') &&
        !permisos.includes('reportes:read_anon') &&
        !permisos.includes('reportes:read_all'))
    ) {
      payload.usuarioId = req.user.sub;
    }

    return this.natsClient.send('reportes.findAll', payload);
  }

  @Get(':id')
  @RequirePermissions(
    'reportes:read_anon',
    'reportes:read_all',
    'reportes:read_own',
  )
  findOne(@Param('id') id: string, @Req() req: any) {
    const payload: { id: string; usuarioId?: string } = { id };
    const permisos: string[] = req.user?.permisos ?? [];

    if (
      req.user?.rol === 'Ciudadano' ||
      (permisos.includes('reportes:read_own') &&
        !permisos.includes('reportes:read_anon') &&
        !permisos.includes('reportes:read_all'))
    ) {
      payload.usuarioId = req.user.sub;
    }

    return this.natsClient.send('reportes.findOne', payload);
  }

  @Put(':id/estado')
  @RequirePermissions('reportes:update')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateReporteStatusDto,
    @Req() req: { user: { sub: string } },
  ) {
    updateDto.id = id;
    updateDto.operadorId = updateDto.operadorId ?? req.user.sub;
    return this.natsClient.send('reportes.updateStatus', updateDto);
  }
}
