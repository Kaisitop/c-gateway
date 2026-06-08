import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NodosController } from './nodos.controller';
import { NatsModule } from '../transports/nats.module';
import { envs } from '../config/envs';

@Module({
  controllers: [NodosController],
  imports: [
    NatsModule,
    JwtModule.register({ secret: envs.jwtService }),
  ],
})
export class NodosModule {}
