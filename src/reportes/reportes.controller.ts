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
  @RequirePermissions('eventos:gestionar')
  create(@Body() createReporteDto: CreateReporteDto, @Req() req: any) {
    // LOPDP: ms-core solo recibe UUID opaco; el gateway asigna el sub del JWT autenticado.
    createReporteDto.usuarioId = req.user.sub;
    return this.natsClient.send('reportes.create', createReporteDto);
  }

  @Get()
  @RequirePermissions('eventos:leer')
  findAll(@Req() req: any) {
    const payload: { usuarioId?: string } = {};
    // Ciudadano: solo sus reportes (UUID del JWT). Operador/Admin: todos.
    if (req.user?.rol === 'Ciudadano') {
      payload.usuarioId = req.user.sub;
    }
    return this.natsClient.send('reportes.findAll', payload);
  }

  @Get(':id')
  @RequirePermissions('eventos:leer')
  findOne(@Param('id') id: string, @Req() req: any) {
    const payload: { id: string; usuarioId?: string } = { id };
    if (req.user?.rol === 'Ciudadano') {
      payload.usuarioId = req.user.sub;
    }
    return this.natsClient.send('reportes.findOne', payload);
  }

  @Put(':id/estado')
  @RequirePermissions('eventos:gestionar')
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateReporteStatusDto) {
    updateDto.id = id;
    return this.natsClient.send('reportes.updateStatus', updateDto);
  }
}
