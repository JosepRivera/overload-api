// ===================
//   HELPERS DE FECHA
// ===================

/** Devuelve una fecha N días atrás, con ajuste opcional de minutos adicionales hacia atrás */
export const daysAgo = (days: number, extraMinutes = 0): Date =>
	new Date(Date.now() - days * 24 * 60 * 60 * 1000 - extraMinutes * 60 * 1000);

export const daysAgoPlus = (days: number, plusMinutes: number): Date =>
	new Date(Date.now() - days * 24 * 60 * 60 * 1000 + plusMinutes * 60 * 1000);

/** Devuelve una fecha N minutos atrás */
export const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60 * 1000);
