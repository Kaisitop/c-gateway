import {
  BadRequestException,
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Inject,
  Headers,
  Ip,
  UseGuards,
  Req,
  Query,
  UploadedFile,
  UseInterceptors,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { NATS_SERVICE } from '../config/service';
import { envs } from '../config/envs';
import { ClientProxy } from '@nestjs/microservices';
import { LoginUserDto, RegisterUserDto, RefreshTokenDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto, DisablePushDto, RegisterPushDto, ResendVerificationDto, CreateUserDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { firstValueFrom } from 'rxjs';
import {
  buildResetPasswordBridgeErrorHtml,
  buildResetPasswordBridgeHtml,
} from './reset-password-bridge.util';

@Controller('auth')
export class AuthController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    const { zonaId, ...userData } = registerUserDto;

    const authResponse = await firstValueFrom(
      this.client.send('register.user.auth', userData),
    );

    return this.assignZonaIfProvided(authResponse, zonaId);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('usuarios:create')
  createUser(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    return this.client.send('create.user.by.admin.auth', {
      ...createUserDto,
      requestedBy: req.user.sub,
    });
  }

  @Post('users/import')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('usuarios:create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1024 * 1024 },
    }),
  )
  async importUsers(
    @UploadedFile() file: { buffer: Buffer; originalname?: string } | undefined,
    @Body('rolNombre') rolNombre: string,
    @Req() req: any,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debe adjuntar un archivo CSV o Excel');
    }

    const name = file.originalname?.toLowerCase() ?? '';
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    const isCsv = name.endsWith('.csv');
    if (!isExcel && !isCsv) {
      throw new BadRequestException('Formato no soportado. Use .csv, .xlsx o .xls');
    }

    const rol = rolNombre === 'Policia' ? 'Policia' : 'Operador';

    const payload = isExcel
      ? {
          format: 'xlsx' as const,
          contentBase64: file.buffer.toString('base64'),
          rolNombreDefault: rol,
          requestedBy: req.user.sub,
        }
      : {
          format: 'csv' as const,
          content: file.buffer.toString('utf-8'),
          rolNombreDefault: rol,
          requestedBy: req.user.sub,
        };

    return firstValueFrom(
      this.client.send('bulk.import.users.by.admin.auth', payload),
    );
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('usuarios:read')
  findUsers(@Query('rol') rol?: string) {
    return this.client.send('usuarios.find', rol ? { rol } : {});
  }

  private async assignZonaIfProvided(authResponse: { id?: string }, zonaId?: string) {
    if (zonaId && authResponse.id) {
      try {
        await firstValueFrom(
          this.client.send('usuario_zonas.set_principal', {
            usuarioId: authResponse.id,
            zonaId,
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

  @Post('push-notifications/register')
  @UseGuards(JwtAuthGuard)
  async registerPushNotifications(
    @Body() registerPushDto: RegisterPushDto,
    @Req() req: { user: { sub: string } },
  ) {
    await firstValueFrom(
      this.client.send('auth.register_fcm_token', {
        userId: req.user.sub,
        fcmToken: registerPushDto.fcmToken,
        plataforma: registerPushDto.plataforma,
      }),
    );

    return { message: 'FCM registrado' };
  }
  
  @Post('verify-email')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.client.send('verify.email.auth', verifyEmailDto);
  }

  @Post('resend-verification')
  resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.client.send('resend.verification.auth', resendVerificationDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.client.send('forgot.password.auth', forgotPasswordDto);
  }

  @Get('reset-password/open')
  @Header('Content-Type', 'text/html; charset=utf-8')
  openResetPasswordInApp(@Query('token') token?: string) {
    const trimmed = token?.trim();
    if (!trimmed || !/^[a-f0-9]{64}$/i.test(trimmed)) {
      return buildResetPasswordBridgeErrorHtml(
        'El enlace no es válido o ya expiró. Solicita uno nuevo desde la app.',
      );
    }

    const encodedToken = encodeURIComponent(trimmed);
    const appResetUrl = `${envs.appResetUrl}?token=${encodedToken}`;
    const androidIntentUrl =
      `intent://reset-password?token=${encodedToken}` +
      `#Intent;scheme=centinela;package=${envs.androidAppPackage};end`;

    return buildResetPasswordBridgeHtml({
      token: trimmed,
      appResetUrl,
      androidIntentUrl,
      androidAppPackage: envs.androidAppPackage,
    });
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
