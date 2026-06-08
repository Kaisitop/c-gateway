import { Controller, Get, Post, Body, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateEventoDto } from './dto/create-evento.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { NATS_SERVICE } from '../config/service';

@Controller('eventos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventosController {
  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}

  @Post()
  @RequirePermissions('eventos:gestionar')
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.natsClient.send('eventos.create', createEventoDto);
  }

  @Get()
  @RequirePermissions('eventos:leer')
  findAll() {
    return this.natsClient.send('eventos.findAll', {});
  }
}
