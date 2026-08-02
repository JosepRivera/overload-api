---
title: Deployar a producción
description: Qué contiene hoy la imagen de producción, y qué falta decidir antes de poder deployar esta API.
draft: false
---

:::caution[Esta página es un borrador]
La imagen Docker de producción existe y compila, pero **la API todavía no se deployó en ningún lado** y todavía no se eligió un destino de hosting. Lo que sigue documenta lo que ya está construido y señala lo que falta.

No trates esto como un runbook de deploy hasta que las preguntas abiertas del final estén respondidas.
:::

## Lo que ya existe

El [`Dockerfile`](https://github.com/JosepRivera/overload-server/blob/main/Dockerfile) es multi-stage y ya tiene un target de producción separado del de desarrollo.

| Stage       | Propósito                                                       |
| ------------ | ------------------------------------------------------------------ |
| `base`         | `node:24-alpine` con pnpm habilitado vía corepack                     |
| `deps`         | Instalación completa de dependencias, compartida por `dev` y `build`   |
| `dev`          | Usado por Docker Compose para desarrollo local con hot reload             |
| `build`        | Corre `prisma generate` y compila TypeScript a `dist/`                     |
| `prod-deps`    | Instalación solo de producción — sin devDependencies                        |
| `prod`         | Imagen final de runtime                                                       |

Construir la imagen de producción:

```bash
docker build --target prod -t overload-api:latest .
```

La imagen resultante corre `node dist/main.js`, expone el puerto `3000`, y setea `NODE_ENV=production`. Contiene solo el output compilado, el cliente Prisma generado, las dependencias de producción, y el schema de Prisma — sin código fuente, sin herramientas de desarrollo.

## Variables de entorno requeridas

El contenedor de producción necesita cada variable que la API valida al arrancar. A diferencia del desarrollo, `DATABASE_URL` **no** se arma automáticamente — eso lo hace Compose localmente, y no hay Compose en producción.

| Variable                | Notas para producción                                                       |
| ------------------------ | -------------------------------------------------------------------------------- |
| `DATABASE_URL`             | Connection string completo de PostgreSQL. Debe proveerse explícitamente.            |
| `PORT`                     | El contenedor expone `3000`; haz que coincida o mapéalo.                             |
| `NODE_ENV`                 | `production`                                                                            |
| `JWT_SECRET`                | Debe ser un secret fuerte y único — nunca el valor de desarrollo.                          |
| `JWT_ACCESS_TOKEN_TTL`      | `15m`                                                                                     |
| `JWT_REFRESH_TOKEN_TTL`     | `7d`                                                                                        |
| `CORS_ORIGIN`               | El origin real del frontend. Un wildcard acá anula toda la política de CORS.                  |
| `BCRYPT_ROUNDS`             | `10` o más. Valores más bajos son solo para tests.                                             |

## Correr las migraciones

El stack de desarrollo corre `prisma migrate deploy` automáticamente al iniciar. **La imagen de producción no lo hace** — su comando va directo a `node dist/main.js`.

Las migraciones, entonces, tienen que correr como un paso deliberado antes de que la versión nueva empiece a servir tráfico:

```bash
pnpm prisma migrate deploy
```

Cómo se cablea ese paso — un init container, un release command, un job de CI — depende de la plataforma de hosting, que todavía no se eligió.

## Preguntas abiertas

Estas bloquean un deploy real y todavía no están decididas:

- **Destino de hosting.** ¿Plataforma de contenedores, PaaS o VM? Esto determina cómo se cablean migraciones, secrets y health checks.
- **Hosting de la base de datos.** ¿PostgreSQL 18 gestionado, o self-hosted? Backups y recuperación point-in-time están sin definir.
- **Endpoint de health check.** La API no expone ninguna ruta `/health`, así que ningún orquestador puede saber hoy si está viva. Notar que en `compose.yaml` el servicio de Postgres tiene healthcheck y el servicio de la API no.
- **Gestión de secrets.** De dónde salen `JWT_SECRET` y las credenciales de la base de datos en runtime.
- **Limpieza de tokens expirados.** El [ADR de sesión en Reglas de Negocio](/es/architecture/business-rules/) asume que un job programado borra los refresh tokens expirados. Ese job todavía no existe.
- **Logging y observabilidad.** No hay logging estructurado ni reporte de errores configurado.
- **Rate limiting.** `/auth/login` acepta hoy intentos ilimitados. Esto no debería exponerse públicamente sin un limiter delante.

:::note[Contribuir a esta página]
Cuando se elija el destino de hosting, reemplaza esta sección con los pasos reales de deploy y borra el banner de borrador de arriba.
:::
