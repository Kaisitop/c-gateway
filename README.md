# Client Gateway - Guia de endpoints HTTP

El `client-gateway` es el punto de entrada HTTP del sistema CENTINELA. Todas las rutas usan el prefijo `/api` y se comunican por NATS con `ms-auth` y `ms-core`.

En el prototipo de titulacion, el microfono no es una Raspberry Pi: la app movil actua como nodo de captura. La app registra el dispositivo como nodo, escucha o clasifica audio, obtiene GPS y envia eventos con `latitud` y `longitud`.

## Base

```text
URL base: http://localhost:3000/api
NATS: nats://localhost:4222
```

Levantar servicios en este orden:

```bash
# 1. PostgreSQL + PostGIS
# 2. NATS
# 3. ms-auth
npm run start:dev

# 4. ms-core
npm run start:dev

# 5. client-gateway
npm run start:dev
```

Para rutas protegidas usar:

```http
Authorization: Bearer {{accessToken}}
```

## Auth

### Registrar usuario

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "email": "operador2@centinela.com",
  "password": "Seguro123!",
  "nombre": "Operador Dos",
  "telefono": "0999999999"
}
```

> **Nota Flujo Ciudadano:** Este endpoint solo gestiona la identidad. Para la app ciudadana, inmediatamente después de registrarse y autenticarse, el frontend debe asignar la zona residencial llamando a `POST /api/zonas/usuarios/{{usuarioId}}/principal`.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@centinela.com",
  "password": "Admin123!"
}
```

Respuesta principal:

```json
{
  "accessToken": "{{accessToken}}",
  "refreshToken": "{{refreshToken}}"
}
```

### Renovar token

```http
POST /api/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

### Logout

```http
POST /api/auth/logout
Content-Type: application/json
```

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

### Verificar email

```http
POST /api/auth/verify-email
Content-Type: application/json
```

```json
{
  "token": "{{tokenVerificacion}}"
}
```

### Solicitar recuperacion de password

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "admin@centinela.com"
}
```

### Resetear password

```http
POST /api/auth/reset-password
Content-Type: application/json
```

```json
{
  "token": "{{tokenReset}}",
  "newPassword": "NuevoSeguro123!"
}
```

### Desactivar usuario

Requiere permiso `usuarios:eliminar`.

```http
DELETE /api/auth/user/{{userId}}
Authorization: Bearer {{accessToken}}
```

## Zonas

Las zonas son areas geograficas de operacion. `geomWkt` es opcional, pero si no se envia la zona queda con geometria vacia y los eventos usaran el fallback de zona del nodo.

### Crear zona

```http
POST /api/zonas
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

Sin poligono:

```json
{
  "nombre": "Zona Centro Milagro",
  "descripcion": "Area comercial principal",
  "riesgoNivel": 3
}
```

Con poligono WKT:

```json
{
  "nombre": "Zona Centro Milagro",
  "descripcion": "Area comercial principal",
  "riesgoNivel": 3,
  "geomWkt": "POLYGON((-79.6000 -2.1600, -79.5800 -2.1600, -79.5800 -2.1800, -79.6000 -2.1800, -79.6000 -2.1600))"
}
```

### Listar zonas

```http
GET /api/zonas
Authorization: Bearer {{accessToken}}
```

### Ver zona

```http
GET /api/zonas/{{zonaId}}
Authorization: Bearer {{accessToken}}
```

### Actualizar zona

```http
PUT /api/zonas/{{zonaId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "descripcion": "Zona actualizada",
  "riesgoNivel": 4,
  "activa": true
}
```

### Eliminar zona

Soft delete: marca `activa = false`.

```http
DELETE /api/zonas/{{zonaId}}
Authorization: Bearer {{accessToken}}
```

### Zonas por Usuario

Asigna una zona principal o suscribe un usuario a zonas de interés (máximo 3).

**Ver zonas del usuario**
```http
GET /api/zonas/usuarios/{{usuarioId}}
Authorization: Bearer {{accessToken}}
```

**Establecer zona principal**
Reemplaza automáticamente si ya existe una.
```http
POST /api/zonas/usuarios/{{usuarioId}}/principal
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "zonaId": "{{zonaId}}"
}
```

**Suscribir a zona adicional**
Límite máximo de 3 zonas por usuario.
```http
POST /api/zonas/usuarios/{{usuarioId}}/suscripciones
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "zonaId": "{{zonaId}}"
}
```

**Eliminar suscripción**
```http
DELETE /api/zonas/usuarios/{{usuarioId}}/suscripciones/{{zonaId}}
Authorization: Bearer {{accessToken}}
```

## Nodos moviles

Un nodo representa el dispositivo que publica detecciones. En el prototipo, normalmente sera un telefono movil con microfono y GPS.

`zonaId` es obligatorio para asignar el dispositivo a una zona. `latitud` y `longitud` son opcionales al registrar el nodo, porque la ubicacion importante se envia en cada evento.

### Crear nodo movil

```http
POST /api/nodos
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "codigo": "MOVIL-OP-02",
  "descripcion": "iPhone - Patrullero zona sur",
  "zonaId": "{{zonaId}}",
  "versionFw": "iOS-17.0"
}
```

Con ubicacion inicial opcional:

```json
{
  "codigo": "MOVIL-OP-03",
  "descripcion": "Android - Patrullero zona centro",
  "zonaId": "{{zonaId}}",
  "latitud": -2.1709,
  "longitud": -79.5871,
  "versionFw": "Android-14"
}
```

### Listar nodos

```http
GET /api/nodos
Authorization: Bearer {{accessToken}}
```

### Filtrar nodos por zona

```http
GET /api/nodos?zonaId={{zonaId}}
Authorization: Bearer {{accessToken}}
```

### Ver nodo

```http
GET /api/nodos/{{nodoId}}
Authorization: Bearer {{accessToken}}
```

### Actualizar nodo

```http
PUT /api/nodos/{{nodoId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "descripcion": "iPhone patrullero actualizado",
  "estado": "mantenimiento",
  "activo": true
}
```

Estados permitidos:

```text
activo | inactivo | mantenimiento
```

### Heartbeat

Actualiza `ultimoHeartbeat` y marca el nodo como `activo`.

```http
POST /api/nodos/{{nodoId}}/heartbeat
Authorization: Bearer {{accessToken}}
```

### Eliminar nodo

Soft delete: marca `activo = false` y `estado = inactivo`.

```http
DELETE /api/nodos/{{nodoId}}
Authorization: Bearer {{accessToken}}
```

## Eventos de audio

Este endpoint es el equivalente HTTP de lo que enviara el bridge MQTT cuando la app movil detecte audio. Para eventos, `latitud` y `longitud` son obligatorias porque representan el punto donde se capturo el audio.

PostGIS guarda la ubicacion con:

```text
ST_MakePoint(longitud, latitud)
```

Esto es correcto: PostGIS usa `X = longitud`, `Y = latitud`.

### Crear evento de disparo

```http
POST /api/eventos
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "tipo": "audio",
  "subtipo": "disparo",
  "nodoId": "{{nodoId}}",
  "latitud": -2.1709,
  "longitud": -79.5871,
  "confianza": 0.95,
  "severidad": 4,
  "fuente": "app_movil",
  "metadatos": {
    "modelo": "yamnet-mobile",
    "disparo": 0.95,
    "grito": 0.02,
    "ambiente": 0.03
  }
}
```

Regla de zona:

```text
1. Busca zona por ST_Contains(zonas.geom, punto)
2. Si no encuentra zona y hay nodoId, usa la zona asignada al nodo
3. Si severidad >= 2 o subtipo es disparo/grito, crea alerta automaticamente
```

### Crear evento de grito

```http
POST /api/eventos
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "tipo": "audio",
  "subtipo": "grito",
  "nodoId": "{{nodoId}}",
  "latitud": -2.1750,
  "longitud": -79.5890,
  "confianza": 0.87,
  "severidad": 3,
  "fuente": "app_movil"
}
```

### Crear evento sin alerta automatica

```http
POST /api/eventos
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "tipo": "audio",
  "subtipo": "fuego_artificial",
  "nodoId": "{{nodoId}}",
  "latitud": -2.1709,
  "longitud": -79.5871,
  "confianza": 0.65,
  "severidad": 1,
  "fuente": "app_movil"
}
```

### Listar eventos

```http
GET /api/eventos
Authorization: Bearer {{accessToken}}
```

## Reportes ciudadanos

La app ciudadana usa estos endpoints para reportar incidentes manuales. `latitud` y `longitud` son obligatorias.

### Crear reporte de panico

```http
POST /api/reportes
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "usuarioId": "{{usuarioId}}",
  "tipo": "panico",
  "descripcion": "Me estan asaltando frente al mercado",
  "latitud": -2.1709,
  "longitud": -79.5871
}
```

`panico` genera alerta automatica con prioridad alta.

### Crear reporte de incidente

```http
POST /api/reportes
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "tipo": "incidente",
  "descripcion": "Pelea entre grupos de personas",
  "latitud": -2.1750,
  "longitud": -79.5890,
  "fotosUrls": [
    "https://storage.centinela.com/evidencia1.jpg"
  ]
}
```

### Crear reporte sospechoso

```http
POST /api/reportes
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "tipo": "sospechoso",
  "descripcion": "Persona merodeando vehiculos estacionados",
  "latitud": -2.1720,
  "longitud": -79.5855
}
```

### Listar reportes

```http
GET /api/reportes
Authorization: Bearer {{accessToken}}
```

### Actualizar estado de reporte

```http
PUT /api/reportes/{{reporteId}}/estado
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "estado": "en_proceso",
  "operadorId": "{{operadorId}}",
  "notasOperador": "Patrulla asignada"
}
```

Estados usados:

```text
pendiente | en_proceso | resuelto | falso
```

## Alertas

Las alertas se generan automaticamente desde eventos criticos o reportes de `panico`/`incidente`.

### Listar alertas

```http
GET /api/alertas
Authorization: Bearer {{accessToken}}
```

### Reconocer alerta

```http
POST /api/alertas/{{alertaId}}/reconocer
Authorization: Bearer {{accessToken}}
```

### Cerrar alerta

```http
POST /api/alertas/{{alertaId}}/cerrar
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "notas": "Unidad policial atendio el caso",
  "falsaAlarma": false
}
```

### Cerrar como falsa alarma

```http
POST /api/alertas/{{alertaId}}/cerrar
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "notas": "Sonido confirmado como petardo",
  "falsaAlarma": true
}
```

## Payload MQTT recomendado para la app movil

El bridge MQTT debe transformar este mensaje en `POST /api/eventos` o publicar el patron NATS `eventos.create`.

```json
{
  "codigoNodo": "MOVIL-OP-02",
  "nodoId": "{{nodoId}}",
  "tipo": "audio",
  "subtipo": "disparo",
  "latitud": -2.1709,
  "longitud": -79.5871,
  "confianza": 0.95,
  "severidad": 4,
  "fuente": "app_movil",
  "metadatos": {
    "modelo": "yamnet-mobile",
    "plataforma": "ios"
  }
}
```

## Flujo de prueba recomendado

```text
1. POST /api/auth/login
2. POST /api/zonas
3. POST /api/nodos
4. POST /api/nodos/:id/heartbeat
5. POST /api/eventos
6. GET  /api/alertas
7. POST /api/alertas/:id/reconocer
8. POST /api/reportes
9. PUT  /api/reportes/:id/estado
10. POST /api/alertas/:id/cerrar
```
