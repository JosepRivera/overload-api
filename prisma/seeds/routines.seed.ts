import type { Prisma } from "@/generated/prisma/client.js";
import {
	EXERCISE_BENCH,
	EXERCISE_CURL,
	EXERCISE_OHP,
	EXERCISE_PULLUP,
	EXERCISE_RDL,
	EXERCISE_ROW,
	EXERCISE_SQUAT,
	ROUTINE_EX_LEG_RDL,
	ROUTINE_EX_LEG_SQUAT,
	ROUTINE_EX_PULL_CURL,
	ROUTINE_EX_PULL_PULLUP,
	ROUTINE_EX_PULL_ROW,
	ROUTINE_EX_PUSH_BENCH,
	ROUTINE_EX_PUSH_OHP,
	ROUTINE_OLD_LEG,
	ROUTINE_PULL_DAY,
	ROUTINE_PUSH_DAY,
	USER_MAIN,
} from "./ids.js";

// 2 rutinas activas + 1 inactiva
// La inactiva cubre: no aparece en GET /routines, PATCH/DELETE devuelven 404
export async function seedRoutines(tx: Prisma.TransactionClient) {
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
}
