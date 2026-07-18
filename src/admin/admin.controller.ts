import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { NATS_SERVICE } from '../config/service';

const CONFIRM_PHRASE = 'LIMPIAR DATOS';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('purge-demo-data')
  @RequirePermissions('usuarios:update')
  async purgeDemoData(
    @Body() body: { confirmPhrase?: string },
    @Req() req: { user?: { sub?: string; rol?: string } },
  ) {
    if (req.user?.rol !== 'Admin') {
      throw new ForbiddenException('Solo un administrador puede limpiar la base de datos');
    }

    if (body?.confirmPhrase !== CONFIRM_PHRASE) {
      throw new BadRequestException(
        `Debes enviar confirmPhrase exactamente igual a "${CONFIRM_PHRASE}"`,
      );
    }

    const requestedBy = req.user?.sub;

    const [app, users] = await Promise.all([
      firstValueFrom(
        this.client.send('maintenance.purgeAppData', { requestedBy }),
      ),
      firstValueFrom(
        this.client.send('maintenance.purgeUsers', { requestedBy }),
      ),
    ]);

    return {
      message: 'Base de datos operativa limpiada correctamente.',
      app,
      users,
    };
  }
}
