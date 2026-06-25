import { Body, Controller, Get, Inject, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { NATS_SERVICE } from '../config/service';
import { UpdatePosicionDto } from './dto/update-posicion.dto';

@Controller('patrullaje')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PatrullajeController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Put('posicion')
  @RequirePermissions('patrullaje:update_position')
  updatePosicion(@Body() body: UpdatePosicionDto, @Req() req: any) {
    return this.client.send('patrullaje.updatePosicion', {
      usuarioId: req.user.sub,
      latitud: body.latitud,
      longitud: body.longitud,
      precisionM: body.precisionM,
      nombre: body.nombre,
    });
  }

  @Get('posiciones')
  @RequirePermissions('patrullaje:read_positions')
  findPosiciones(@Query('maxAgeSec') maxAgeSec?: string) {
    const parsed = maxAgeSec ? parseInt(maxAgeSec, 10) : undefined;
    return this.client.send('patrullaje.findPosicionesActivas', {
      maxAgeSec: parsed && !Number.isNaN(parsed) ? parsed : undefined,
    });
  }
}
