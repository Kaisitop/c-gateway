import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AlertasController } from './alertas.controller';
import { NatsModule } from '../transports/nats.module';
import { envs } from '../config/envs';

@Module({
  imports: [
    NatsModule,
    JwtModule.register({ secret: envs.jwtService }),
  ],
  controllers: [AlertasController],
})
export class AlertasModule {}
