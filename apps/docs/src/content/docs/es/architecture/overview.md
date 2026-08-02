---
title: Arquitectura — Overload
description: "Overload es una REST API para tracking avanzado de entrenamiento de fuerza, construida alrededor del principio de progressive overload."
---

# Arquitectura — Overload

## Overview

Overload es una REST API para tracking avanzado de entrenamiento de fuerza, construida alrededor del principio de **progressive overload**: aumentar gradualmente el estímulo de entrenamiento para producir adaptaciones musculares continuas y medibles.

Construida con **NestJS 11** siguiendo una arquitectura modular estricta, **PostgreSQL** como base de datos principal, y **Prisma** como ORM.

---

## Diagramas visuales

### Arquitectura de módulos
![Arquitectura de módulos](/assets/architecture-modules.svg)

### Esquema de base de datos
![Esquema de base de datos](/assets/er-diagram.svg)

> Exportar ambos diagramas desde Excalidraw y guardarlos en `apps/docs/public/assets/`.

---

## Estructura de módulos

```
src/
├── auth/           # Registro, login, logout, refresh de token
├── jwt/            # Firma, verificación y guard de JWT (jose)
├── user/           # Gestión del perfil de usuario
├── exercises/      # CRUD del catálogo personal de ejercicios
├── routines/       # Gestión de planes de entrenamiento
├── workouts/       # Ejecución e historial de sesiones de workout
├── sets/           # Registro de sets individuales
├── analytics/      # PRs, cálculo de volumen y estimación de 1RM
├── prisma/         # Módulo global de Prisma, inyectable en toda la app
├── config/         # Validación de variables de entorno con Zod
├── types/          # Extensiones de tipos (Express, globales)
├── app.module.ts   # Módulo raíz
└── main.ts         # Bootstrap: Scalar, Helmet, CORS, pipes globales
```

---

## Ciclo de vida del request

```
Request del cliente
     │
     ▼
main.ts (Helmet, CORS, Pipes globales)
     │
     ▼
Controller (matching de ruta)
     │
     ▼
JwtGuard (valida el access token vía jose)
     │
     ▼
Zod Pipe (valida y parsea el body del request)
     │
     ▼
Service (lógica de negocio)
     │
     ▼
PrismaService (acceso a la base de datos)
     │
     ▼
PostgreSQL
     │
     ▼
Response → Cliente
```

---

## Flujo de autenticación

```
POST /auth/register → hashea la contraseña (bcrypt, cost 12) → crea el usuario
POST /auth/login    → verifica la contraseña → emite access token (15m) + refresh token (7d)
POST /auth/refresh  → valida el hash del refresh token → rota los tokens
POST /auth/logout   → revoca el refresh token (revoked_at = NOW())
```

**Decisiones clave:**
- Los access tokens son JWT stateless — nunca se guardan en la DB
- Los refresh tokens se guardan como hash SHA-256 — nunca en texto plano
- Máximo 5 refresh tokens activos por usuario
- Rotación de tokens: el token anterior se revoca en cada refresh

---

## Dependencias entre módulos

| Módulo           | Depende de                                       |
| ------------------ | --------------------------------------------------- |
| AuthModule           | UserModule + JwtModule + PrismaModule                  |
| JwtModule            | standalone (jose)                                        |
| UserModule           | PrismaModule                                              |
| ExercisesModule      | PrismaModule                                                |
| RoutinesModule       | ExercisesModule + PrismaModule                                |
| WorkoutsModule       | RoutinesModule + PrismaModule                                   |
| SetsModule           | WorkoutsModule + ExercisesModule + PrismaModule                    |
| AnalyticsModule      | PrismaModule                                                         |
| PrismaModule         | global — sin dependencias                                               |
| ConfigModule         | global — validación con Zod                                              |

---

## Infraestructura

```
Docker Compose (desarrollo)
├── overload-postgres-dev   # PostgreSQL 18 — puerto 5432
└── overload-app-dev        # App NestJS con hot-reload — puerto 3000
                            # Debugger expuesto en el puerto 9229
```

Las migraciones pendientes se aplican automáticamente al iniciar el contenedor, vía `prisma migrate deploy`.

---

## Base de datos

El schema consta de 7 tablas. Las métricas derivadas (volumen, PRs, 1RM) se calculan on-demand y nunca se persisten.

Ver la referencia completa del schema: [database-schema.md](./database-schema.md)

---

## Decisiones de diseño clave

Las decisiones de herramientas — Zod sobre class-validator, Biome sobre ESLint + Prettier, Prisma sobre TypeORM, PostgreSQL sobre MongoDB, jose sobre `@nestjs/jwt` — están a la vista directamente en [`package.json`](https://github.com/JosepRivera/overload-server/blob/main/package.json) y no se re-documentan acá.

Las decisiones que definen el comportamiento real, con el razonamiento y las alternativas rechazadas detrás de cada una, viven en [Reglas de Negocio](/es/architecture/business-rules/):

| Decisión              | Elección                                    | Dónde                                                                            |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Autenticación             | Access tokens stateless + refresh tokens persistidos | [Gestión de sesión](/es/architecture/business-rules/#gestión-de-sesión)                 |
| Métricas                  | Calculadas on-demand, nunca persistidas          | [Analytics y Métricas](/es/architecture/business-rules/#analytics-y-métricas)             |
| Borrado de ejercicio       | Soft delete vía `is_archived`                      | [Archivar](/es/architecture/business-rules/#archivar-soft-delete)                          |
| Sets de calentamiento      | Excluidos de estadísticas y PRs                     | [Sets de calentamiento](/es/architecture/business-rules/#sets-de-calentamiento)             |
| Workouts activos           | Máx 1 por usuario a la vez                            | [Iniciar un workout](/es/architecture/business-rules/#iniciar-un-workout)                    |
| Refresh tokens             | Máx 5 activos por usuario                              | [Gestión de sesión](/es/architecture/business-rules/#gestión-de-sesión)                        |
