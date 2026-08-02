---
title: Referencia de la API
description: Una página por módulo, con ejemplos reales de request y response para cada endpoint.
---

Documentación a nivel de endpoint, agrupada por módulo. Cada página muestra la forma del request, la forma de la respuesta, y todos los códigos de estado que ese endpoint puede devolver.

Para una versión en vivo que puedes llamar directamente desde el navegador, usa la [referencia interactiva de la API](http://localhost:3000/api/docs) — se genera desde el mismo documento OpenAPI que es la fuente de verdad de este sitio para los schemas de request/response.

## Módulos

| Módulo                          | Qué cubre                                                |
| --------------------------------- | ------------------------------------------------------------ |
| [Auth](/es/api/auth/)               | Registro, login, refresh y logout                              |
| [Users](/es/api/users/)             | Lectura de tu propio perfil                                      |
| [Exercises](/es/api/exercises/)     | Tu catálogo personal de ejercicios                                 |
| [Routines](/es/api/routines/)       | Planes de entrenamiento reutilizables                               |
| [Workouts](/es/api/workouts/)       | Sesiones de entrenamiento                                             |
| [Sets](/es/api/sets/)               | Registros individuales de peso × reps                                  |
| [Analytics](/es/api/analytics/)     | Volumen, records personales, 1RM y progresión                            |

## Antes de empezar

- **[Autenticación](/es/guides/authentication/)** — cómo obtener, usar, refrescar y revocar tokens
- **[Convenciones de la API](/es/architecture/api-conventions/)** — envoltorio de respuesta, paginación, reglas de URL y datos que aplican a todos los módulos
- **[Errores](/es/reference/errors/)** — cada código de estado y las dos formas de error que devuelve la API

Si nunca hiciste un request contra esta API, el [Quickstart](/es/guides/quickstart/) recorre todo el camino en unos cinco minutos.
