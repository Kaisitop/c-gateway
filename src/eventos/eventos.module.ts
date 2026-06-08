import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventosController } from './eventos.controller';
import { NatsModule } from '../transports/nats.module';
import { envs } from '../config/envs';

@Module({
  imports: [
    NatsModule,
    JwtModule.register({ secret: envs.jwtService }),
  ],
  controllers: [EventosController],
})
export class EventosModule {}
