---
title: Ejercicios
description: Tu catálogo personal de movimientos — creado, listado, actualizado y archivado.
---

Los ejercicios son el catálogo personal contra el que un usuario registra sets. Cada usuario gestiona su propio catálogo de forma independiente.

**Base:** `/exercises`
**Autenticación:** requerida en todos los endpoints

## El objeto ejercicio

```json
{
  "id": "f1013006-…",
  "user_id": "95d40fe1-…",
  "name": "Press de banca",
  "category": "chest",
  "type": "compound",
  "notes": null,
  "is_archived": false,
  "created_at": "2026-03-10T14:42:44.468Z",
  "updated_at": "2026-03-10T14:42:44.468Z"
}
```

`category` — uno de `chest`, `back`, `legs`, `shoulders`, `arms`, `core`, `cardio`, `other`.
`type` — uno de `compound`, `isolation`, `cardio`, `stretching`.

---

## Crear un ejercicio

```
POST /exercises
```

**Body**

```json
{ "name": "Press de banca", "category": "chest", "type": "compound", "notes": "Ejercicio principal de pecho" }
```

| Campo      | Requerido | Regla                                       |
| ---------- | --------- | ---------------------------------------------- |
| `name`     | sí        | 1–150 caracteres, único por usuario (solo activos) |
| `category` | sí        | una de las 8 categorías de arriba                  |
| `type`     | sí        | uno de los 4 tipos de arriba                        |
| `notes`    | no        | hasta 2000 caracteres, opcional                      |

| Status | Cuándo                                              |
| ------ | ------------------------------------------------------ |
| `201`  | Creado                                                   |
| `400`  | Validación fallida                                        |
| `409`  | Ya tienes un ejercicio activo con este nombre                |

---

## Listar ejercicios

```
GET /exercises?includeArchived=false
```

Ordenados por nombre. Los archivados se excluyen salvo que pases `includeArchived=true`.

| Status | Cuándo   |
| ------ | -------- |
| `200`  | Éxito     |

---

## Obtener un ejercicio

```
GET /exercises/:id
```

Devuelve el ejercicio sin importar si está archivado.

| Status | Cuándo                       |
| ------ | ------------------------------ |
| `200`  | Éxito                            |
| `400`  | `id` no es un UUID válido         |
| `404`  | No encontrado                     |

---

## Actualizar un ejercicio

```
PATCH /exercises/:id
```

Todos los campos opcionales — `name`, `category`, `type`, `notes`.

| Status | Cuándo                                          |
| ------ | -------------------------------------------------- |
| `200`  | Actualizado                                          |
| `400`  | `id` mal formado, o validación fallida                |
| `404`  | No encontrado                                         |
| `409`  | El nombre choca con otro ejercicio activo              |

---

## Archivar un ejercicio

```
PATCH /exercises/:id/archive
```

Soft delete. Marca `is_archived: true`; el ejercicio desaparece del listado por defecto pero cada set registrado contra él se conserva intacto. No se pueden registrar sets nuevos contra él.

| Status | Cuándo                       |
| ------ | ------------------------------ |
| `200`  | Archivado                        |
| `400`  | `id` no es un UUID válido         |
| `404`  | No encontrado                     |

## Relacionado

- [Trackear un workout](/es/guides/track-a-workout/)
- [Reglas de negocio — Ejercicios](/es/architecture/business-rules/#ejercicios)
