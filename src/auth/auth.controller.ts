import { Controller, Post, Delete, Body, Param, Inject, Headers, Ip, UseGuards, Req } from '@nestjs/common';

import { NATS_SERVICE } from '../config/service';
import { ClientProxy } from '@nestjs/microservices';
import { LoginUserDto, RegisterUserDto, RefreshTokenDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('auth')
export class AuthController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Post('register')
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.client.send('register.user.auth', registerUserDto)
  }

  @Post('login')
  loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.client.send('login.user.auth', {
      ...loginUserDto,
      ipAddress,
      userAgent: userAgent || 'Unknown',
    });
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
