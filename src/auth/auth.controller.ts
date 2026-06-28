import {
  BadRequestException,
  Controller,
  Post,
  Delete,
  Body,
  Param,
  Inject,
  Headers,
  Ip,
  UseGuards,
  Req,
} from '@nestjs/common';

import { NATS_SERVICE } from '../config/service';
import { ClientProxy } from '@nestjs/microservices';
import { LoginUserDto, RegisterUserDto, RefreshTokenDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, DisablePushDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { firstValueFrom } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    const { zonaId, ...userData } = registerUserDto;
    
    // 1. Registrar usuario en ms-auth
    const authResponse = await firstValueFrom(
      this.client.send('register.user.auth', userData)
    );

    // 2. Si hay zonaId, asignar la zona principal en ms-core (obligatorio si se envía)
    if (zonaId && authResponse.id) {
      try {
        await firstValueFrom(
          this.client.send('usuario_zonas.set_principal', {
            usuarioId: authResponse.id,
            zonaId: zonaId,
          }),
        );
      } catch (error) {
        console.error('Error al asignar zona en el registro:', error);
        const message =
          error?.message ??
          error?.response?.message ??
          'No se pudo asignar la zona al usuario registrado';
        throw new BadRequestException(message);
      }
    }

    return authResponse;
  }

  @Post('login')
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    // 1. Iniciar sesión en ms-auth
    const loginResponse = await firstValueFrom(
      this.client.send('login.user.auth', {
        ...loginUserDto,
        ipAddress,
        userAgent: userAgent || 'Unknown',
      })
    );

    return this.enrichWithZonaPrincipal(loginResponse);
  }

  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const refreshResponse = await firstValueFrom(
      this.client.send('refresh.token.auth', {
        ...refreshTokenDto,
        ipAddress,
        userAgent: userAgent || 'Unknown',
      }),
    );

    return this.enrichWithZonaPrincipal(refreshResponse);
  }

  private async enrichWithZonaPrincipal<T extends { user: { id: string }; zonaPrincipalId?: string | null }>(
    response: T,
  ): Promise<T & { zonaPrincipalId: string | null }> {
    try {
      const zonas = await firstValueFrom(
        this.client.send('usuario_zonas.get_by_user', response.user.id),
      );

      const zonaPrincipal = zonas.find((z: { tipo: string; zonaId: string }) => z.tipo === 'principal');
      response.zonaPrincipalId = zonaPrincipal?.zonaId ?? null;
    } catch (error) {
      console.error('Error al obtener zonas del usuario:', error);
      response.zonaPrincipalId = null;
    }

    return response as T & { zonaPrincipalId: string | null };
  }

  @Post('logout')
  logoutUser(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.client.send('logout.user.auth', refreshTokenDto);
  }

  @Post('push-notifications/disable')
  @UseGuards(JwtAuthGuard)
  async disablePushNotifications(@Body() disablePushDto: DisablePushDto) {
    if (disablePushDto.fcmToken) {
      await firstValueFrom(
        this.client.send('dispositivos.deactivate_fcm_token', {
          fcmToken: disablePushDto.fcmToken,
        }),
      );
    }

    return { message: 'Notificaciones push desactivadas' };
  }
  
  @Post('verify-email')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.client.send('verify.email.auth', verifyEmailDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.client.send('forgot.password.auth', forgotPasswordDto);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.client.send('reset.password.auth', resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: any) {
    return this.client.send('change.password.auth', {
      userId: req.user.sub,
      ...changePasswordDto,
    });
  }

  @Delete('user/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('usuarios:update')
  deactivateUser(@Param('id') userId: string, @Req() req: any) {
    return this.client.send('deactivate.user.auth', {
      userId,
      requestedBy: req.user.sub, // ID del admin que ejecuta la acción
    });
  }
}
