import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../config/service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('heat-map')
  @RequirePermissions('analytics:heat_map', 'eventos:read_all', 'eventos:read')
  getHeatMap(@Query('dias') dias?: string) {
    const parsed = dias ? parseInt(dias, 10) : 30;
    return this.client.send('analytics.heatMap', { dias: Number.isNaN(parsed) ? 30 : parsed });
  }
}
