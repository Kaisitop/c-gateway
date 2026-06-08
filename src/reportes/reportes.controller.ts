import { Controller, Get, Post, Put, Body, Param, Inject, UseGuards } from '@nestjs/common';
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
  create(@Body() createReporteDto: CreateReporteDto) {
    return this.natsClient.send('reportes.create', createReporteDto);
  }

  @Get()
  @RequirePermissions('eventos:leer')
  findAll() {
    return this.natsClient.send('reportes.findAll', {});
  }

  @Put(':id/estado')
  @RequirePermissions('eventos:gestionar')
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateReporteStatusDto) {
    updateDto.id = id;
    return this.natsClient.send('reportes.updateStatus', updateDto);
  }
}
