---
title: Changelog
description: Historial de versiones de Overload — todavía no arrancó.
---

:::caution[Esta página es un borrador]
**Todavía no se publicó ninguna versión.** La API está en `0.0.1` y nunca se taggeó ni se deployó, así que no hay nada que registrar acá.

Esta página existe para que la estructura ya esté lista — complétala a partir del primer release en adelante, en lugar de intentar reconstruir el historial después.
:::

## Qué va acá

Una entrada por versión publicada, la más nueva primero. Cada entrada debería indicar la versión, su fecha de release, y los cambios agrupados bajo **Added**, **Changed**, **Fixed**, **Deprecated** y **Removed** — siguiendo [Keep a Changelog](https://keepachangelog.com/).

Escribe para la persona que integra contra la API, no para la que escribió el commit. "Agregado `POST /users/me` para actualizar tu perfil" es útil. "Refactorizado el servicio de usuarios" no lo es.

## Qué hacer antes del primer release

- Decidir un esquema de versionado. [Semantic versioning](https://semver.org/) es la expectativa por defecto para una API.
- Decidir qué cuenta como breaking. Sacar un campo, renombrarlo, o cambiar un código de estado rompen clientes — incluso cuando ningún endpoint desaparece.
- Taggear los releases en Git para que las entradas acá mapeen a algo verificable.

## Plantilla

```markdown
## [0.1.0] — 2026-XX-XX

### Added
- `PATCH /users/me` — actualizar tu propio perfil.

### Changed
- Los errores de validación ahora devuelven una única forma unificada.

### Fixed
- Los ejercicios archivados ya no aparecen en el listado por defecto del catálogo.
```

## Sin publicar

Todo lo que hoy está en `main` es sin publicar. Los módulos que existen hoy — autenticación, usuarios, ejercicios, rutinas, workouts, sets y analytics — van a formar la primera entrada una vez que se corte una versión.

Ver [Deployment](/es/guides/deployment/) para lo que todavía bloquea un primer release.
