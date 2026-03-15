import bcrypt from "bcrypt";
import { PrismaService } from "@/prisma/prisma.service";

const prisma = new PrismaService();

// ===================
//   CONSTANTES (IDs)
// ===================
export const USER_MAIN = "a1b2c3d4-0001-4001-a001-000000000001";
export const EXERCISE_BENCH = "a1b2c3d4-0002-4001-a001-000000000001";
export const EXERCISE_OHP = "a1b2c3d4-0003-4001-a001-000000000001";
export const EXERCISE_PULLUP = "a1b2c3d4-0004-4001-a001-000000000001";
export const EXERCISE_ROW = "a1b2c3d4-0005-4001-a001-000000000001";
export const EXERCISE_SQUAT = "a1b2c3d4-0006-4001-a001-000000000001";
export const EXERCISE_RDL = "a1b2c3d4-0007-4001-a001-000000000001";
export const EXERCISE_CURL = "a1b2c3d4-0008-4001-a001-000000000001";
export const EXERCISE_PLANK = "a1b2c3d4-0009-4001-a001-000000000001";
export const EXERCISE_ARCHIVED = "a1b2c3d4-0010-4001-a001-000000000001";
export const EXERCISE_ARCHIVED2 = "a1b2c3d4-0011-4001-a001-000000000001";
export const ROUTINE_PUSH_DAY = "a1b2c3d4-0012-4001-a001-000000000001";
export const ROUTINE_PULL_DAY = "a1b2c3d4-0013-4001-a001-000000000001";
export const ROUTINE_OLD_LEG = "a1b2c3d4-0014-4001-a001-000000000001";
export const ROUTINE_EX_PUSH_BENCH = "a1b2c3d4-0015-4001-a001-000000000001";
export const ROUTINE_EX_PUSH_OHP = "a1b2c3d4-0016-4001-a001-000000000001";
export const ROUTINE_EX_PULL_PULLUP = "a1b2c3d4-0017-4001-a001-000000000001";
export const ROUTINE_EX_PULL_ROW = "a1b2c3d4-0018-4001-a001-000000000001";
export const ROUTINE_EX_PULL_CURL = "a1b2c3d4-0019-4001-a001-000000000001";
export const ROUTINE_EX_LEG_SQUAT = "a1b2c3d4-0020-4001-a001-000000000001";
export const ROUTINE_EX_LEG_RDL = "a1b2c3d4-0021-4001-a001-000000000001";
export const WORKOUT_1 = "a1b2c3d4-0022-4001-a001-000000000001";
export const WORKOUT_2 = "a1b2c3d4-0023-4001-a001-000000000001";
export const WORKOUT_3 = "a1b2c3d4-0024-4001-a001-000000000001";
export const WORKOUT_4 = "a1b2c3d4-0025-4001-a001-000000000001";

// Sets usan clave compuesta (workout_id + exercise_id + set_number), no necesitan ID propio

// ===================
//   HELPERS
// ===================

/** Devuelve una fecha N días atrás, con ajuste opcional de minutos adicionales hacia atrás */
const daysAgo = (days: number, extraMinutes = 0): Date =>
	new Date(Date.now() - days * 24 * 60 * 60 * 1000 - extraMinutes * 60 * 1000);

const daysAgoPlus = (days: number, plusMinutes: number): Date =>
	new Date(Date.now() - days * 24 * 60 * 60 * 1000 + plusMinutes * 60 * 1000);

/** Devuelve una fecha N minutos atrás */
const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60 * 1000);

// ===================
//   MAIN
// ===================
async function main() {
	const passwordHash = await bcrypt.hash("Password123!", 10);

	await prisma.$transaction(async (tx) => {
		// ─────────────────────────────────────────────
		// 1. USERS
		// ─────────────────────────────────────────────
		await tx.user.upsert({
			where: { id: USER_MAIN },
			update: {},
			create: {
				id: USER_MAIN,
				email: "joseprivera@overload.dev",
				name: "Josep Rivera",
				password_hash: passwordHash,
				is_active: true,
				email_verified: false,
			},
		});

		// ─────────────────────────────────────────────
		// 2. EXERCISES
		// ─────────────────────────────────────────────
		// 8 activos + 2 archivados
		// Los archivados cubren: no aparecen en catálogo activo, no se pueden añadir
		// a rutinas, y sus nombres no conflictúan con ejercicios activos
		await Promise.all([
			tx.exercise.upsert({
				where: { id: EXERCISE_BENCH },
				update: {},
				create: {
					id: EXERCISE_BENCH,
					user_id: USER_MAIN,
					name: "Bench Press",
					category: "chest",
					type: "compound",
					notes: "Bajar controlado 3 segundos",
					is_archived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_OHP },
				update: {},
				create: {
					id: EXERCISE_OHP,
					user_id: USER_MAIN,
					name: "Overhead Press",
					category: "shoulders",
					type: "compound",
					notes: null,
					is_archived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_PULLUP },
				update: {},
				create: {
					id: EXERCISE_PULLUP,
					user_id: USER_MAIN,
					name: "Pull-up",
					category: "back",
					type: "compound",
					notes: "Agarre prono, escápulas activas",
					is_archived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_ROW },
				update: {},
				create: {
					id: EXERCISE_ROW,
					user_id: USER_MAIN,
					name: "Barbell Row",
					category: "back",
					type: "compound",
					notes: null,
					is_archived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_SQUAT },
				update: {},
				create: {
					id: EXERCISE_SQUAT,
					user_id: USER_MAIN,
					name: "Squat",
					category: "legs",
					type: "compound",
					notes: "Profundidad paralela mínima",
					is_archived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_RDL },
				update: {},
				create: {
					id: EXERCISE_RDL,
					user_id: USER_MAIN,
					name: "Romanian Deadlift",
					category: "legs",
					type: "compound",
					notes: null,
					is_archived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_CURL },
				update: {},
				create: {
					id: EXERCISE_CURL,
					user_id: USER_MAIN,
					name: "Bicep Curl",
					category: "arms",
					type: "isolation",
					notes: null,
					is_archived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_PLANK },
				update: {},
				create: {
					id: EXERCISE_PLANK,
					user_id: USER_MAIN,
					name: "Plank",
					category: "core",
					type: "stretching",
					notes: null,
					is_archived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_ARCHIVED },
				update: {},
				create: {
					id: EXERCISE_ARCHIVED,
					user_id: USER_MAIN,
					name: "Lateral Raise",
					category: "shoulders",
					type: "isolation",
					notes: null,
					is_archived: true,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_ARCHIVED2 },
				update: {},
				create: {
					id: EXERCISE_ARCHIVED2,
					user_id: USER_MAIN,
					name: "Cable Fly",
					category: "chest",
					type: "isolation",
					notes: "Ejercicio descontinuado",
					is_archived: true,
				},
			}),
		]);

		// ─────────────────────────────────────────────
		// 3. ROUTINES
		// ─────────────────────────────────────────────
		// 2 activas + 1 inactiva
		// La inactiva cubre: no aparece en GET /routines, PATCH/DELETE devuelven 404
		await Promise.all([
			tx.routine.upsert({
				where: { id: ROUTINE_PUSH_DAY },
				update: {},
				create: {
					id: ROUTINE_PUSH_DAY,
					user_id: USER_MAIN,
					name: "Push Day",
					description: "Press de pecho y hombro",
					is_active: true,
				},
			}),
			tx.routine.upsert({
				where: { id: ROUTINE_PULL_DAY },
				update: {},
				create: {
					id: ROUTINE_PULL_DAY,
					user_id: USER_MAIN,
					name: "Pull Day",
					description: "Tracción y bíceps",
					is_active: true,
				},
			}),
			tx.routine.upsert({
				where: { id: ROUTINE_OLD_LEG },
				update: {},
				create: {
					id: ROUTINE_OLD_LEG,
					user_id: USER_MAIN,
					name: "Old Leg Day",
					description: "Rutina de pierna descontinuada",
					is_active: false,
				},
			}),
		]);

		// ─────────────────────────────────────────────
		// 4. ROUTINE_EXERCISES
		// ─────────────────────────────────────────────
		// Push Day:    BENCH (order 0), OHP (order 1)
		// Pull Day:    PULLUP (order 0), ROW (order 1), CURL (order 2)
		// Old Leg Day: SQUAT (order 0), RDL (order 1)
		// Old Leg Day tiene exercises aunque la rutina esté inactiva — relación válida en DB
		await Promise.all([
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PUSH_BENCH },
				update: {},
				create: {
					id: ROUTINE_EX_PUSH_BENCH,
					routine_id: ROUTINE_PUSH_DAY,
					exercise_id: EXERCISE_BENCH,
					target_sets: 4,
					target_reps_min: 6,
					target_reps_max: 10,
					target_rest_sec: 120,
					order_index: 0,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PUSH_OHP },
				update: {},
				create: {
					id: ROUTINE_EX_PUSH_OHP,
					routine_id: ROUTINE_PUSH_DAY,
					exercise_id: EXERCISE_OHP,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
					order_index: 1,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PULL_PULLUP },
				update: {},
				create: {
					id: ROUTINE_EX_PULL_PULLUP,
					routine_id: ROUTINE_PULL_DAY,
					exercise_id: EXERCISE_PULLUP,
					target_sets: 4,
					target_reps_min: 5,
					target_reps_max: 8,
					target_rest_sec: 120,
					order_index: 0,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PULL_ROW },
				update: {},
				create: {
					id: ROUTINE_EX_PULL_ROW,
					routine_id: ROUTINE_PULL_DAY,
					exercise_id: EXERCISE_ROW,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 12,
					target_rest_sec: 90,
					order_index: 1,
					notes: "Codos a 45°",
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PULL_CURL },
				update: {},
				create: {
					id: ROUTINE_EX_PULL_CURL,
					routine_id: ROUTINE_PULL_DAY,
					exercise_id: EXERCISE_CURL,
					target_sets: 3,
					target_reps_min: 10,
					target_reps_max: 15,
					target_rest_sec: 60,
					order_index: 2,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_LEG_SQUAT },
				update: {},
				create: {
					id: ROUTINE_EX_LEG_SQUAT,
					routine_id: ROUTINE_OLD_LEG,
					exercise_id: EXERCISE_SQUAT,
					target_sets: 5,
					target_reps_min: 5,
					target_reps_max: 5,
					target_rest_sec: 180,
					order_index: 0,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_LEG_RDL },
				update: {},
				create: {
					id: ROUTINE_EX_LEG_RDL,
					routine_id: ROUTINE_OLD_LEG,
					exercise_id: EXERCISE_RDL,
					target_sets: 3,
					target_reps_min: 8,
					target_reps_max: 10,
					target_rest_sec: 120,
					order_index: 1,
					notes: null,
				},
			}),
		]);

		// ─────────────────────────────────────────────
		// 5. WORKOUTS
		// ─────────────────────────────────────────────
		// WORKOUT_1: completado, hace 10 días, Push Day, con notes
		// WORKOUT_2: completado, hace 7 días,  Pull Day, sin notes
		// WORKOUT_3: completado, hace 3 días,  sin routine, con notes
		// WORKOUT_4: ACTIVO (finished_at null), hace 20 min, Push Day
		//
		// NOTA: daysAgo(N, M) resta N días Y M minutos → finished_at queda M minutos
		// después de started_at (ambos en el pasado, finished > started ✓)
		await Promise.all([
			tx.workout.upsert({
				where: { id: WORKOUT_1 },
				update: {},
				create: {
					id: WORKOUT_1,
					user_id: USER_MAIN,
					routine_id: ROUTINE_PUSH_DAY,
					started_at: daysAgo(10),
					finished_at: daysAgoPlus(10, 75),
					notes: "Buena sesión, PR en bench",
				},
			}),
			tx.workout.upsert({
				where: { id: WORKOUT_2 },
				update: {},
				create: {
					id: WORKOUT_2,
					user_id: USER_MAIN,
					routine_id: ROUTINE_PULL_DAY,
					started_at: daysAgo(7),
					finished_at: daysAgoPlus(7, 60),
					notes: null,
				},
			}),
			tx.workout.upsert({
				where: { id: WORKOUT_3 },
				update: {},
				create: {
					id: WORKOUT_3,
					user_id: USER_MAIN,
					routine_id: null,
					started_at: daysAgo(3),
					finished_at: daysAgoPlus(3, 90),
					notes: "Sin rutina, improvisado",
				},
			}),
			tx.workout.upsert({
				where: { id: WORKOUT_4 },
				update: {},
				create: {
					id: WORKOUT_4,
					user_id: USER_MAIN,
					routine_id: ROUTINE_PUSH_DAY,
					started_at: minutesAgo(20),
					finished_at: null,
					notes: null,
				},
			}),
		]);

		// ─────────────────────────────────────────────
		// 6. SETS
		// ─────────────────────────────────────────────
		// Total: 30 sets (8 warmup, 22 working)
		//
		// Reglas aplicadas:
		// - is_warmup: true  → rpe siempre null, peso notablemente menor
		// - is_warmup: false → rpe en algunos (7.0–9.5), null en otros
		// - weight: 0 válido para Pull-up (bodyweight)
		// - Bicep Curl incluye sets con reps > 10 (12, 11) → Epley NO debe aplicar
		// - Todos los demás working sets tienen reps <= 10 → Epley SÍ aplica
		await Promise.all([
			// ── WORKOUT_1 · Bench Press ──────────────
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_1,
						exercise_id: EXERCISE_BENCH,
						set_number: 1,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_1,
					exercise_id: EXERCISE_BENCH,
					set_number: 1,
					weight: 40,
					reps: 15,
					rpe: null,
					is_warmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_1,
						exercise_id: EXERCISE_BENCH,
						set_number: 2,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_1,
					exercise_id: EXERCISE_BENCH,
					set_number: 2,
					weight: 80,
					reps: 8,
					rpe: 8.0,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_1,
						exercise_id: EXERCISE_BENCH,
						set_number: 3,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_1,
					exercise_id: EXERCISE_BENCH,
					set_number: 3,
					weight: 82.5,
					reps: 7,
					rpe: 8.5,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_1,
						exercise_id: EXERCISE_BENCH,
						set_number: 4,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_1,
					exercise_id: EXERCISE_BENCH,
					set_number: 4,
					weight: 85,
					reps: 6,
					rpe: 9.0,
					is_warmup: false,
				},
			}),

			// ── WORKOUT_1 · Overhead Press ───────────
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_1,
						exercise_id: EXERCISE_OHP,
						set_number: 1,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_1,
					exercise_id: EXERCISE_OHP,
					set_number: 1,
					weight: 30,
					reps: 12,
					rpe: null,
					is_warmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_1,
						exercise_id: EXERCISE_OHP,
						set_number: 2,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_1,
					exercise_id: EXERCISE_OHP,
					set_number: 2,
					weight: 55,
					reps: 10,
					rpe: 7.5,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_1,
						exercise_id: EXERCISE_OHP,
						set_number: 3,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_1,
					exercise_id: EXERCISE_OHP,
					set_number: 3,
					weight: 57.5,
					reps: 9,
					rpe: 8.0,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_1,
						exercise_id: EXERCISE_OHP,
						set_number: 4,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_1,
					exercise_id: EXERCISE_OHP,
					set_number: 4,
					weight: 60,
					reps: 8,
					rpe: 8.5,
					is_warmup: false,
				},
			}),

			// ── WORKOUT_2 · Pull-up (weight 0 = bodyweight) ──
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_PULLUP,
						set_number: 1,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_PULLUP,
					set_number: 1,
					weight: 0,
					reps: 10,
					rpe: null,
					is_warmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_PULLUP,
						set_number: 2,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_PULLUP,
					set_number: 2,
					weight: 0,
					reps: 7,
					rpe: 8.0,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_PULLUP,
						set_number: 3,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_PULLUP,
					set_number: 3,
					weight: 10,
					reps: 6,
					rpe: 8.5,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_PULLUP,
						set_number: 4,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_PULLUP,
					set_number: 4,
					weight: 10,
					reps: 5,
					rpe: 9.0,
					is_warmup: false,
				},
			}),

			// ── WORKOUT_2 · Barbell Row ───────────────
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_ROW,
						set_number: 1,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_ROW,
					set_number: 1,
					weight: 40,
					reps: 15,
					rpe: null,
					is_warmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_ROW,
						set_number: 2,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_ROW,
					set_number: 2,
					weight: 75,
					reps: 10,
					rpe: null,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_ROW,
						set_number: 3,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_ROW,
					set_number: 3,
					weight: 77.5,
					reps: 9,
					rpe: 8.0,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_ROW,
						set_number: 4,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_ROW,
					set_number: 4,
					weight: 80,
					reps: 8,
					rpe: 8.5,
					is_warmup: false,
				},
			}),

			// ── WORKOUT_2 · Bicep Curl ────────────────
			// sets 2 y 3 tienen reps > 10 → Epley NO debe aplicar (caso de test para analytics)
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_CURL,
						set_number: 1,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_CURL,
					set_number: 1,
					weight: 10,
					reps: 15,
					rpe: null,
					is_warmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_CURL,
						set_number: 2,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_CURL,
					set_number: 2,
					weight: 20,
					reps: 12,
					rpe: null,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_CURL,
						set_number: 3,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_CURL,
					set_number: 3,
					weight: 22.5,
					reps: 11,
					rpe: 7.5,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_2,
						exercise_id: EXERCISE_CURL,
						set_number: 4,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_2,
					exercise_id: EXERCISE_CURL,
					set_number: 4,
					weight: 22.5,
					reps: 10,
					rpe: 8.0,
					is_warmup: false,
				},
			}),

			// ── WORKOUT_3 · Squat ─────────────────────
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_3,
						exercise_id: EXERCISE_SQUAT,
						set_number: 1,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_3,
					exercise_id: EXERCISE_SQUAT,
					set_number: 1,
					weight: 60,
					reps: 10,
					rpe: null,
					is_warmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_3,
						exercise_id: EXERCISE_SQUAT,
						set_number: 2,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_3,
					exercise_id: EXERCISE_SQUAT,
					set_number: 2,
					weight: 100,
					reps: 5,
					rpe: 8.0,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_3,
						exercise_id: EXERCISE_SQUAT,
						set_number: 3,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_3,
					exercise_id: EXERCISE_SQUAT,
					set_number: 3,
					weight: 105,
					reps: 5,
					rpe: 8.5,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_3,
						exercise_id: EXERCISE_SQUAT,
						set_number: 4,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_3,
					exercise_id: EXERCISE_SQUAT,
					set_number: 4,
					weight: 107.5,
					reps: 4,
					rpe: 9.5,
					is_warmup: false,
				},
			}),

			// ── WORKOUT_3 · Romanian Deadlift ─────────
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_3,
						exercise_id: EXERCISE_RDL,
						set_number: 1,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_3,
					exercise_id: EXERCISE_RDL,
					set_number: 1,
					weight: 50,
					reps: 12,
					rpe: null,
					is_warmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_3,
						exercise_id: EXERCISE_RDL,
						set_number: 2,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_3,
					exercise_id: EXERCISE_RDL,
					set_number: 2,
					weight: 90,
					reps: 10,
					rpe: 7.5,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_3,
						exercise_id: EXERCISE_RDL,
						set_number: 3,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_3,
					exercise_id: EXERCISE_RDL,
					set_number: 3,
					weight: 95,
					reps: 8,
					rpe: 8.0,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_3,
						exercise_id: EXERCISE_RDL,
						set_number: 4,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_3,
					exercise_id: EXERCISE_RDL,
					set_number: 4,
					weight: 97.5,
					reps: 8,
					rpe: 8.5,
					is_warmup: false,
				},
			}),

			// ── WORKOUT_4 · Bench Press (sesión activa en curso) ──
			// Solo 3 sets: simula sesión iniciada, aún no terminada
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_4,
						exercise_id: EXERCISE_BENCH,
						set_number: 1,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_4,
					exercise_id: EXERCISE_BENCH,
					set_number: 1,
					weight: 40,
					reps: 15,
					rpe: null,
					is_warmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_4,
						exercise_id: EXERCISE_BENCH,
						set_number: 2,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_4,
					exercise_id: EXERCISE_BENCH,
					set_number: 2,
					weight: 82.5,
					reps: 8,
					rpe: 8.0,
					is_warmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workout_id_exercise_id_set_number: {
						workout_id: WORKOUT_4,
						exercise_id: EXERCISE_BENCH,
						set_number: 3,
					},
				},
				update: {},
				create: {
					workout_id: WORKOUT_4,
					exercise_id: EXERCISE_BENCH,
					set_number: 3,
					weight: 85,
					reps: 7,
					rpe: 8.5,
					is_warmup: false,
				},
			}),
		]);
	});
}

main()
	.then(() => {
		console.log(
			"✅ Seed completado\n" +
				"   👤 1 usuario\n" +
				"   💪 10 ejercicios (8 activos, 2 archivados)\n" +
				"   📋 3 rutinas (2 activas, 1 inactiva) · 7 routine_exercises\n" +
				"   🏋️  4 workouts (3 completados, 1 activo)\n" +
				"   📊 30 sets (8 warmup, 22 working)",
		);
	})
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		process.exit(0);
	});
