import { Controller, Get, Post, Put, Delete, Body, Param, Inject, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../config/service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CreateZonaDto, UpdateZonaDto } from './dto';

@Controller('zonas')
export class ZonasController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('zonas:create')
  create(@Body() createZonaDto: CreateZonaDto) {
    return this.client.send('zonas.create', createZonaDto);
  }

  @Get()
  findAll() {
    return this.client.send('zonas.findAll', {});
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('zonas:read')
  findOne(@Param('id') id: string) {
    return this.client.send('zonas.findOne', id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('zonas:update')
  update(@Param('id') id: string, @Body() updateZonaDto: UpdateZonaDto) {
    return this.client.send('zonas.update', { id, data: updateZonaDto });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('zonas:update')
  remove(@Param('id') id: string) {
    return this.client.send('zonas.remove', id);
  }

  // ---- Endpoints para Usuario_Zonas ----

  @Get('usuarios/:usuarioId')
  @UseGuards(JwtAuthGuard)
  getUserZonas(@Param('usuarioId') usuarioId: string, @Req() req: any) {
    this.checkSelfOrAdmin(req, usuarioId);
    return this.client.send('usuario_zonas.get_by_user', usuarioId);
  }

  @Post('usuarios/:usuarioId/principal')
  @UseGuards(JwtAuthGuard)
  setZonaPrincipal(@Param('usuarioId') usuarioId: string, @Body('zonaId') zonaId: string, @Req() req: any) {
    this.checkSelfOrAdmin(req, usuarioId);
    return this.client.send('usuario_zonas.set_principal', { usuarioId, zonaId });
  }

  @Post('usuarios/:usuarioId/suscripciones')
  @UseGuards(JwtAuthGuard)
  subscribeZona(@Param('usuarioId') usuarioId: string, @Body('zonaId') zonaId: string, @Req() req: any) {
    this.checkSelfOrAdmin(req, usuarioId);
    return this.client.send('usuario_zonas.subscribe', { usuarioId, zonaId });
  }

  @Delete('usuarios/:usuarioId/suscripciones/:zonaId')
  @UseGuards(JwtAuthGuard)
  unsubscribeZona(@Param('usuarioId') usuarioId: string, @Param('zonaId') zonaId: string, @Req() req: any) {
    this.checkSelfOrAdmin(req, usuarioId);
    return this.client.send('usuario_zonas.unsubscribe', { usuarioId, zonaId });
  }

  private checkSelfOrAdmin(req: any, targetUserId: string) {
    const user = req.user;
    if (
      user.sub !== targetUserId &&
      !user.permisos?.includes('zonas:update') &&
      !user.permisos?.includes('usuarios:update')
    ) {
      throw new ForbiddenException('No tienes permisos para acceder a las zonas de este usuario');
    }
  }
}
