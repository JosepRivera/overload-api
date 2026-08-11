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

// Sets usan clave compuesta (workoutId + exerciseId + setNumber), no necesitan ID propio

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
				passwordHash: passwordHash,
				isActive: true,
				emailVerified: false,
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
					userId: USER_MAIN,
					name: "Bench Press",
					category: "chest",
					type: "compound",
					notes: "Bajar controlado 3 segundos",
					isArchived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_OHP },
				update: {},
				create: {
					id: EXERCISE_OHP,
					userId: USER_MAIN,
					name: "Overhead Press",
					category: "shoulders",
					type: "compound",
					notes: null,
					isArchived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_PULLUP },
				update: {},
				create: {
					id: EXERCISE_PULLUP,
					userId: USER_MAIN,
					name: "Pull-up",
					category: "back",
					type: "compound",
					notes: "Agarre prono, escápulas activas",
					isArchived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_ROW },
				update: {},
				create: {
					id: EXERCISE_ROW,
					userId: USER_MAIN,
					name: "Barbell Row",
					category: "back",
					type: "compound",
					notes: null,
					isArchived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_SQUAT },
				update: {},
				create: {
					id: EXERCISE_SQUAT,
					userId: USER_MAIN,
					name: "Squat",
					category: "legs",
					type: "compound",
					notes: "Profundidad paralela mínima",
					isArchived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_RDL },
				update: {},
				create: {
					id: EXERCISE_RDL,
					userId: USER_MAIN,
					name: "Romanian Deadlift",
					category: "legs",
					type: "compound",
					notes: null,
					isArchived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_CURL },
				update: {},
				create: {
					id: EXERCISE_CURL,
					userId: USER_MAIN,
					name: "Bicep Curl",
					category: "arms",
					type: "isolation",
					notes: null,
					isArchived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_PLANK },
				update: {},
				create: {
					id: EXERCISE_PLANK,
					userId: USER_MAIN,
					name: "Plank",
					category: "core",
					type: "stretching",
					notes: null,
					isArchived: false,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_ARCHIVED },
				update: {},
				create: {
					id: EXERCISE_ARCHIVED,
					userId: USER_MAIN,
					name: "Lateral Raise",
					category: "shoulders",
					type: "isolation",
					notes: null,
					isArchived: true,
				},
			}),
			tx.exercise.upsert({
				where: { id: EXERCISE_ARCHIVED2 },
				update: {},
				create: {
					id: EXERCISE_ARCHIVED2,
					userId: USER_MAIN,
					name: "Cable Fly",
					category: "chest",
					type: "isolation",
					notes: "Ejercicio descontinuado",
					isArchived: true,
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
					userId: USER_MAIN,
					name: "Push Day",
					description: "Press de pecho y hombro",
					isActive: true,
				},
			}),
			tx.routine.upsert({
				where: { id: ROUTINE_PULL_DAY },
				update: {},
				create: {
					id: ROUTINE_PULL_DAY,
					userId: USER_MAIN,
					name: "Pull Day",
					description: "Tracción y bíceps",
					isActive: true,
				},
			}),
			tx.routine.upsert({
				where: { id: ROUTINE_OLD_LEG },
				update: {},
				create: {
					id: ROUTINE_OLD_LEG,
					userId: USER_MAIN,
					name: "Old Leg Day",
					description: "Rutina de pierna descontinuada",
					isActive: false,
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
					routineId: ROUTINE_PUSH_DAY,
					exerciseId: EXERCISE_BENCH,
					targetSets: 4,
					targetRepsMin: 6,
					targetRepsMax: 10,
					targetRestSec: 120,
					orderIndex: 0,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PUSH_OHP },
				update: {},
				create: {
					id: ROUTINE_EX_PUSH_OHP,
					routineId: ROUTINE_PUSH_DAY,
					exerciseId: EXERCISE_OHP,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
					orderIndex: 1,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PULL_PULLUP },
				update: {},
				create: {
					id: ROUTINE_EX_PULL_PULLUP,
					routineId: ROUTINE_PULL_DAY,
					exerciseId: EXERCISE_PULLUP,
					targetSets: 4,
					targetRepsMin: 5,
					targetRepsMax: 8,
					targetRestSec: 120,
					orderIndex: 0,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PULL_ROW },
				update: {},
				create: {
					id: ROUTINE_EX_PULL_ROW,
					routineId: ROUTINE_PULL_DAY,
					exerciseId: EXERCISE_ROW,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 12,
					targetRestSec: 90,
					orderIndex: 1,
					notes: "Codos a 45°",
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_PULL_CURL },
				update: {},
				create: {
					id: ROUTINE_EX_PULL_CURL,
					routineId: ROUTINE_PULL_DAY,
					exerciseId: EXERCISE_CURL,
					targetSets: 3,
					targetRepsMin: 10,
					targetRepsMax: 15,
					targetRestSec: 60,
					orderIndex: 2,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_LEG_SQUAT },
				update: {},
				create: {
					id: ROUTINE_EX_LEG_SQUAT,
					routineId: ROUTINE_OLD_LEG,
					exerciseId: EXERCISE_SQUAT,
					targetSets: 5,
					targetRepsMin: 5,
					targetRepsMax: 5,
					targetRestSec: 180,
					orderIndex: 0,
					notes: null,
				},
			}),
			tx.routineExercise.upsert({
				where: { id: ROUTINE_EX_LEG_RDL },
				update: {},
				create: {
					id: ROUTINE_EX_LEG_RDL,
					routineId: ROUTINE_OLD_LEG,
					exerciseId: EXERCISE_RDL,
					targetSets: 3,
					targetRepsMin: 8,
					targetRepsMax: 10,
					targetRestSec: 120,
					orderIndex: 1,
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
		// WORKOUT_4: ACTIVO (finishedAt null), hace 20 min, Push Day
		//
		// NOTA: daysAgo(N, M) resta N días Y M minutos → finishedAt queda M minutos
		// después de startedAt (ambos en el pasado, finished > started ✓)
		await Promise.all([
			tx.workout.upsert({
				where: { id: WORKOUT_1 },
				update: {},
				create: {
					id: WORKOUT_1,
					userId: USER_MAIN,
					routineId: ROUTINE_PUSH_DAY,
					startedAt: daysAgo(10),
					finishedAt: daysAgoPlus(10, 75),
					notes: "Buena sesión, PR en bench",
				},
			}),
			tx.workout.upsert({
				where: { id: WORKOUT_2 },
				update: {},
				create: {
					id: WORKOUT_2,
					userId: USER_MAIN,
					routineId: ROUTINE_PULL_DAY,
					startedAt: daysAgo(7),
					finishedAt: daysAgoPlus(7, 60),
					notes: null,
				},
			}),
			tx.workout.upsert({
				where: { id: WORKOUT_3 },
				update: {},
				create: {
					id: WORKOUT_3,
					userId: USER_MAIN,
					routineId: null,
					startedAt: daysAgo(3),
					finishedAt: daysAgoPlus(3, 90),
					notes: "Sin rutina, improvisado",
				},
			}),
			tx.workout.upsert({
				where: { id: WORKOUT_4 },
				update: {},
				create: {
					id: WORKOUT_4,
					userId: USER_MAIN,
					routineId: ROUTINE_PUSH_DAY,
					startedAt: minutesAgo(20),
					finishedAt: null,
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
		// - isWarmup: true  → rpe siempre null, peso notablemente menor
		// - isWarmup: false → rpe en algunos (7.0–9.5), null en otros
		// - weight: 0 válido para Pull-up (bodyweight)
		// - Bicep Curl incluye sets con reps > 10 (12, 11) → Epley NO debe aplicar
		// - Todos los demás working sets tienen reps <= 10 → Epley SÍ aplica
		await Promise.all([
			// ── WORKOUT_1 · Bench Press ──────────────
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_1,
						exerciseId: EXERCISE_BENCH,
						setNumber: 1,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_1,
					exerciseId: EXERCISE_BENCH,
					setNumber: 1,
					weight: 40,
					reps: 15,
					rpe: null,
					isWarmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_1,
						exerciseId: EXERCISE_BENCH,
						setNumber: 2,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_1,
					exerciseId: EXERCISE_BENCH,
					setNumber: 2,
					weight: 80,
					reps: 8,
					rpe: 8.0,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_1,
						exerciseId: EXERCISE_BENCH,
						setNumber: 3,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_1,
					exerciseId: EXERCISE_BENCH,
					setNumber: 3,
					weight: 82.5,
					reps: 7,
					rpe: 8.5,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_1,
						exerciseId: EXERCISE_BENCH,
						setNumber: 4,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_1,
					exerciseId: EXERCISE_BENCH,
					setNumber: 4,
					weight: 85,
					reps: 6,
					rpe: 9.0,
					isWarmup: false,
				},
			}),

			// ── WORKOUT_1 · Overhead Press ───────────
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_1,
						exerciseId: EXERCISE_OHP,
						setNumber: 1,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_1,
					exerciseId: EXERCISE_OHP,
					setNumber: 1,
					weight: 30,
					reps: 12,
					rpe: null,
					isWarmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_1,
						exerciseId: EXERCISE_OHP,
						setNumber: 2,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_1,
					exerciseId: EXERCISE_OHP,
					setNumber: 2,
					weight: 55,
					reps: 10,
					rpe: 7.5,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_1,
						exerciseId: EXERCISE_OHP,
						setNumber: 3,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_1,
					exerciseId: EXERCISE_OHP,
					setNumber: 3,
					weight: 57.5,
					reps: 9,
					rpe: 8.0,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_1,
						exerciseId: EXERCISE_OHP,
						setNumber: 4,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_1,
					exerciseId: EXERCISE_OHP,
					setNumber: 4,
					weight: 60,
					reps: 8,
					rpe: 8.5,
					isWarmup: false,
				},
			}),

			// ── WORKOUT_2 · Pull-up (weight 0 = bodyweight) ──
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_PULLUP,
						setNumber: 1,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_PULLUP,
					setNumber: 1,
					weight: 0,
					reps: 10,
					rpe: null,
					isWarmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_PULLUP,
						setNumber: 2,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_PULLUP,
					setNumber: 2,
					weight: 0,
					reps: 7,
					rpe: 8.0,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_PULLUP,
						setNumber: 3,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_PULLUP,
					setNumber: 3,
					weight: 10,
					reps: 6,
					rpe: 8.5,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_PULLUP,
						setNumber: 4,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_PULLUP,
					setNumber: 4,
					weight: 10,
					reps: 5,
					rpe: 9.0,
					isWarmup: false,
				},
			}),

			// ── WORKOUT_2 · Barbell Row ───────────────
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_ROW,
						setNumber: 1,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_ROW,
					setNumber: 1,
					weight: 40,
					reps: 15,
					rpe: null,
					isWarmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_ROW,
						setNumber: 2,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_ROW,
					setNumber: 2,
					weight: 75,
					reps: 10,
					rpe: null,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_ROW,
						setNumber: 3,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_ROW,
					setNumber: 3,
					weight: 77.5,
					reps: 9,
					rpe: 8.0,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_ROW,
						setNumber: 4,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_ROW,
					setNumber: 4,
					weight: 80,
					reps: 8,
					rpe: 8.5,
					isWarmup: false,
				},
			}),

			// ── WORKOUT_2 · Bicep Curl ────────────────
			// sets 2 y 3 tienen reps > 10 → Epley NO debe aplicar (caso de test para analytics)
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_CURL,
						setNumber: 1,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_CURL,
					setNumber: 1,
					weight: 10,
					reps: 15,
					rpe: null,
					isWarmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_CURL,
						setNumber: 2,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_CURL,
					setNumber: 2,
					weight: 20,
					reps: 12,
					rpe: null,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_CURL,
						setNumber: 3,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_CURL,
					setNumber: 3,
					weight: 22.5,
					reps: 11,
					rpe: 7.5,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_2,
						exerciseId: EXERCISE_CURL,
						setNumber: 4,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_2,
					exerciseId: EXERCISE_CURL,
					setNumber: 4,
					weight: 22.5,
					reps: 10,
					rpe: 8.0,
					isWarmup: false,
				},
			}),

			// ── WORKOUT_3 · Squat ─────────────────────
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_3,
						exerciseId: EXERCISE_SQUAT,
						setNumber: 1,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_3,
					exerciseId: EXERCISE_SQUAT,
					setNumber: 1,
					weight: 60,
					reps: 10,
					rpe: null,
					isWarmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_3,
						exerciseId: EXERCISE_SQUAT,
						setNumber: 2,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_3,
					exerciseId: EXERCISE_SQUAT,
					setNumber: 2,
					weight: 100,
					reps: 5,
					rpe: 8.0,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_3,
						exerciseId: EXERCISE_SQUAT,
						setNumber: 3,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_3,
					exerciseId: EXERCISE_SQUAT,
					setNumber: 3,
					weight: 105,
					reps: 5,
					rpe: 8.5,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_3,
						exerciseId: EXERCISE_SQUAT,
						setNumber: 4,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_3,
					exerciseId: EXERCISE_SQUAT,
					setNumber: 4,
					weight: 107.5,
					reps: 4,
					rpe: 9.5,
					isWarmup: false,
				},
			}),

			// ── WORKOUT_3 · Romanian Deadlift ─────────
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_3,
						exerciseId: EXERCISE_RDL,
						setNumber: 1,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_3,
					exerciseId: EXERCISE_RDL,
					setNumber: 1,
					weight: 50,
					reps: 12,
					rpe: null,
					isWarmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_3,
						exerciseId: EXERCISE_RDL,
						setNumber: 2,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_3,
					exerciseId: EXERCISE_RDL,
					setNumber: 2,
					weight: 90,
					reps: 10,
					rpe: 7.5,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_3,
						exerciseId: EXERCISE_RDL,
						setNumber: 3,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_3,
					exerciseId: EXERCISE_RDL,
					setNumber: 3,
					weight: 95,
					reps: 8,
					rpe: 8.0,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_3,
						exerciseId: EXERCISE_RDL,
						setNumber: 4,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_3,
					exerciseId: EXERCISE_RDL,
					setNumber: 4,
					weight: 97.5,
					reps: 8,
					rpe: 8.5,
					isWarmup: false,
				},
			}),

			// ── WORKOUT_4 · Bench Press (sesión activa en curso) ──
			// Solo 3 sets: simula sesión iniciada, aún no terminada
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_4,
						exerciseId: EXERCISE_BENCH,
						setNumber: 1,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_4,
					exerciseId: EXERCISE_BENCH,
					setNumber: 1,
					weight: 40,
					reps: 15,
					rpe: null,
					isWarmup: true,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_4,
						exerciseId: EXERCISE_BENCH,
						setNumber: 2,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_4,
					exerciseId: EXERCISE_BENCH,
					setNumber: 2,
					weight: 82.5,
					reps: 8,
					rpe: 8.0,
					isWarmup: false,
				},
			}),
			tx.set.upsert({
				where: {
					workoutId_exerciseId_setNumber: {
						workoutId: WORKOUT_4,
						exerciseId: EXERCISE_BENCH,
						setNumber: 3,
					},
				},
				update: {},
				create: {
					workoutId: WORKOUT_4,
					exerciseId: EXERCISE_BENCH,
					setNumber: 3,
					weight: 85,
					reps: 7,
					rpe: 8.5,
					isWarmup: false,
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
