import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ZonasModule } from './zonas/zonas.module';
import { NodosModule } from './nodos/nodos.module';
import { EventosModule } from './eventos/eventos.module';
import { ReportesModule } from './reportes/reportes.module';
import { AlertasModule } from './alertas/alertas.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PatrullajeModule } from './patrullaje/patrullaje.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    ZonasModule,
    NodosModule,
    EventosModule,
    ReportesModule,
    AlertasModule,
    AnalyticsModule,
    RealtimeModule,
    PatrullajeModule,
    NotificacionesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
