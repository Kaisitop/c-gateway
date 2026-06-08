import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ZonasModule } from './zonas/zonas.module';
import { NodosModule } from './nodos/nodos.module';
import { EventosModule } from './eventos/eventos.module';
import { ReportesModule } from './reportes/reportes.module';
import { AlertasModule } from './alertas/alertas.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    ZonasModule,
    NodosModule,
    EventosModule,
    ReportesModule,
    AlertasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
