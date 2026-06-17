import { Controller, Post, Delete, Body, Param, Inject, Headers, Ip, UseGuards, Req } from '@nestjs/common';

import { NATS_SERVICE } from '../config/service';
import { ClientProxy } from '@nestjs/microservices';
import { LoginUserDto, RegisterUserDto, RefreshTokenDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
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

    // 2. Si hay zonaId, asignar la zona principal en ms-core
    if (zonaId && authResponse.id) {
      try {
        await firstValueFrom(
          this.client.send('usuario_zonas.set_principal', {
            usuarioId: authResponse.id,
            zonaId: zonaId,
          })
        );
      } catch (error) {
        // Podríamos loggear el error, pero no fallar el registro principal
        console.error('Error al asignar zona en el registro:', error);
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

    // 2. Obtener las zonas del usuario desde ms-core
    try {
      const zonas = await firstValueFrom(
        this.client.send('usuario_zonas.get_by_user', loginResponse.user.id)
      );
      
      const zonaPrincipal = zonas.find((z: any) => z.tipo === 'principal');
      
      if (zonaPrincipal) {
        // Inyectar zonaPrincipalId en la respuesta
        loginResponse.zonaPrincipalId = zonaPrincipal.zonaId;
      }
    } catch (error) {
      console.error('Error al obtener zonas en el login:', error);
    }

    return loginResponse;
  }

  @Post('refresh')
  refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.client.send('refresh.token.auth', {
      ...refreshTokenDto,
      ipAddress,
      userAgent: userAgent || 'Unknown',
    });
  }

  @Post('logout')
  logoutUser(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.client.send('logout.user.auth', refreshTokenDto);
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

  @Delete('user/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('usuarios:eliminar')
  deactivateUser(@Param('id') userId: string, @Req() req: any) {
    return this.client.send('deactivate.user.auth', {
      userId,
      requestedBy: req.user.sub, // ID del admin que ejecuta la acción
    });
  }
}
