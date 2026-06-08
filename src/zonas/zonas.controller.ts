import { Controller, Get, Post, Put, Delete, Body, Param, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../config/service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CreateZonaDto, UpdateZonaDto } from './dto';

@Controller('zonas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ZonasController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @RequirePermissions('zonas:gestionar')
  create(@Body() createZonaDto: CreateZonaDto) {
    return this.client.send('zonas.create', createZonaDto);
  }

  @Get()
  @RequirePermissions('zonas:leer')
  findAll() {
    return this.client.send('zonas.findAll', {});
  }

  @Get(':id')
  @RequirePermissions('zonas:leer')
  findOne(@Param('id') id: string) {
    return this.client.send('zonas.findOne', id);
  }

  @Put(':id')
  @RequirePermissions('zonas:gestionar')
  update(@Param('id') id: string, @Body() updateZonaDto: UpdateZonaDto) {
    return this.client.send('zonas.update', { id, data: updateZonaDto });
  }

  @Delete(':id')
  @RequirePermissions('zonas:gestionar')
  remove(@Param('id') id: string) {
    return this.client.send('zonas.remove', id);
  }
}
