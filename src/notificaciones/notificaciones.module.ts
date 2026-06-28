import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificacionesController } from './notificaciones.controller';
import { NatsModule } from '../transports/nats.module';
import { envs } from '../config/envs';

@Module({
  controllers: [NotificacionesController],
  imports: [
    NatsModule,
    JwtModule.register({ secret: envs.jwtService }),
  ],
})
export class NotificacionesModule {}
