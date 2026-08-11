import type { Prisma } from "@/generated/prisma/client.js";
import {
	EXERCISE_ARCHIVED,
	EXERCISE_ARCHIVED2,
	EXERCISE_BENCH,
	EXERCISE_CURL,
	EXERCISE_OHP,
	EXERCISE_PLANK,
	EXERCISE_PULLUP,
	EXERCISE_RDL,
	EXERCISE_ROW,
	EXERCISE_SQUAT,
	USER_MAIN,
} from "./ids.js";

// 8 activos + 2 archivados
// Los archivados cubren: no aparecen en catálogo activo, no se pueden añadir
// a rutinas, y sus nombres no conflictúan con ejercicios activos
export async function seedExercises(tx: Prisma.TransactionClient) {
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
}
