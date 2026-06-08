import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../config/service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CreateNodoDto, UpdateNodoDto } from './dto';

@Controller('nodos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NodosController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @RequirePermissions('nodos:gestionar')
  create(@Body() createNodoDto: CreateNodoDto) {
    return this.client.send('nodos.create', createNodoDto);
  }

  @Get()
  @RequirePermissions('nodos:leer')
  findAll(@Query('zonaId') zonaId?: string) {
    return this.client.send('nodos.findAll', { zonaId });
  }

  @Get(':id')
  @RequirePermissions('nodos:leer')
  findOne(@Param('id') id: string) {
    return this.client.send('nodos.findOne', id);
  }

  @Put(':id')
  @RequirePermissions('nodos:gestionar')
  update(@Param('id') id: string, @Body() updateNodoDto: UpdateNodoDto) {
    return this.client.send('nodos.update', { id, data: updateNodoDto });
  }

  @Post(':id/heartbeat')
  @RequirePermissions('nodos:gestionar')
  heartbeat(@Param('id') id: string) {
    return this.client.send('nodos.heartbeat', id);
  }

  @Delete(':id')
  @RequirePermissions('nodos:gestionar')
  remove(@Param('id') id: string) {
    return this.client.send('nodos.remove', id);
  }
}
