import type { Prisma } from "@/generated/prisma/client.js";
import {
	EXERCISE_BENCH,
	EXERCISE_CURL,
	EXERCISE_OHP,
	EXERCISE_PULLUP,
	EXERCISE_RDL,
	EXERCISE_ROW,
	EXERCISE_SQUAT,
	WORKOUT_1,
	WORKOUT_2,
	WORKOUT_3,
	WORKOUT_4,
} from "./ids.js";

// Total: 31 sets (8 warmup, 23 working)
//
// Reglas aplicadas:
// - isWarmup: true  → rpe siempre null, peso notablemente menor
// - isWarmup: false → rpe en algunos (7.0–9.5), null en otros
// - weight: 0 válido para Pull-up (bodyweight)
// - Bicep Curl incluye sets con reps > 10 (12, 11) → Epley NO debe aplicar
// - Todos los demás working sets tienen reps <= 10 → Epley SÍ aplica
export async function seedSets(tx: Prisma.TransactionClient) {
	const upsertSet = (
		workoutId: string,
		exerciseId: string,
		setNumber: number,
		data: { weight: number; reps: number; rpe: number | null; isWarmup: boolean },
	) =>
		tx.set.upsert({
			where: { workoutId_exerciseId_setNumber: { workoutId, exerciseId, setNumber } },
			update: {},
			create: { workoutId, exerciseId, setNumber, ...data },
		});

	await Promise.all([
		// ── WORKOUT_1 · Bench Press ──────────────
		upsertSet(WORKOUT_1, EXERCISE_BENCH, 1, { weight: 40, reps: 15, rpe: null, isWarmup: true }),
		upsertSet(WORKOUT_1, EXERCISE_BENCH, 2, { weight: 80, reps: 8, rpe: 8.0, isWarmup: false }),
		upsertSet(WORKOUT_1, EXERCISE_BENCH, 3, {
			weight: 82.5,
			reps: 7,
			rpe: 8.5,
			isWarmup: false,
		}),
		upsertSet(WORKOUT_1, EXERCISE_BENCH, 4, { weight: 85, reps: 6, rpe: 9.0, isWarmup: false }),

		// ── WORKOUT_1 · Overhead Press ───────────
		upsertSet(WORKOUT_1, EXERCISE_OHP, 1, { weight: 30, reps: 12, rpe: null, isWarmup: true }),
		upsertSet(WORKOUT_1, EXERCISE_OHP, 2, { weight: 55, reps: 10, rpe: 7.5, isWarmup: false }),
		upsertSet(WORKOUT_1, EXERCISE_OHP, 3, {
			weight: 57.5,
			reps: 9,
			rpe: 8.0,
			isWarmup: false,
		}),
		upsertSet(WORKOUT_1, EXERCISE_OHP, 4, { weight: 60, reps: 8, rpe: 8.5, isWarmup: false }),

		// ── WORKOUT_2 · Pull-up (weight 0 = bodyweight) ──
		upsertSet(WORKOUT_2, EXERCISE_PULLUP, 1, { weight: 0, reps: 10, rpe: null, isWarmup: true }),
		upsertSet(WORKOUT_2, EXERCISE_PULLUP, 2, { weight: 0, reps: 7, rpe: 8.0, isWarmup: false }),
		upsertSet(WORKOUT_2, EXERCISE_PULLUP, 3, {
			weight: 10,
			reps: 6,
			rpe: 8.5,
			isWarmup: false,
		}),
		upsertSet(WORKOUT_2, EXERCISE_PULLUP, 4, {
			weight: 10,
			reps: 5,
			rpe: 9.0,
			isWarmup: false,
		}),

		// ── WORKOUT_2 · Barbell Row ───────────────
		upsertSet(WORKOUT_2, EXERCISE_ROW, 1, { weight: 40, reps: 15, rpe: null, isWarmup: true }),
		upsertSet(WORKOUT_2, EXERCISE_ROW, 2, { weight: 75, reps: 10, rpe: null, isWarmup: false }),
		upsertSet(WORKOUT_2, EXERCISE_ROW, 3, {
			weight: 77.5,
			reps: 9,
			rpe: 8.0,
			isWarmup: false,
		}),
		upsertSet(WORKOUT_2, EXERCISE_ROW, 4, { weight: 80, reps: 8, rpe: 8.5, isWarmup: false }),

		// ── WORKOUT_2 · Bicep Curl ────────────────
		// sets 2 y 3 tienen reps > 10 → Epley NO debe aplicar (caso de test para analytics)
		upsertSet(WORKOUT_2, EXERCISE_CURL, 1, { weight: 10, reps: 15, rpe: null, isWarmup: true }),
		upsertSet(WORKOUT_2, EXERCISE_CURL, 2, { weight: 20, reps: 12, rpe: null, isWarmup: false }),
		upsertSet(WORKOUT_2, EXERCISE_CURL, 3, {
			weight: 22.5,
			reps: 11,
			rpe: 7.5,
			isWarmup: false,
		}),
		upsertSet(WORKOUT_2, EXERCISE_CURL, 4, {
			weight: 22.5,
			reps: 10,
			rpe: 8.0,
			isWarmup: false,
		}),

		// ── WORKOUT_3 · Squat ─────────────────────
		upsertSet(WORKOUT_3, EXERCISE_SQUAT, 1, { weight: 60, reps: 10, rpe: null, isWarmup: true }),
		upsertSet(WORKOUT_3, EXERCISE_SQUAT, 2, { weight: 100, reps: 5, rpe: 8.0, isWarmup: false }),
		upsertSet(WORKOUT_3, EXERCISE_SQUAT, 3, { weight: 105, reps: 5, rpe: 8.5, isWarmup: false }),
		upsertSet(WORKOUT_3, EXERCISE_SQUAT, 4, {
			weight: 107.5,
			reps: 4,
			rpe: 9.5,
			isWarmup: false,
		}),

		// ── WORKOUT_3 · Romanian Deadlift ─────────
		upsertSet(WORKOUT_3, EXERCISE_RDL, 1, { weight: 50, reps: 12, rpe: null, isWarmup: true }),
		upsertSet(WORKOUT_3, EXERCISE_RDL, 2, { weight: 90, reps: 10, rpe: 7.5, isWarmup: false }),
		upsertSet(WORKOUT_3, EXERCISE_RDL, 3, { weight: 95, reps: 8, rpe: 8.0, isWarmup: false }),
		upsertSet(WORKOUT_3, EXERCISE_RDL, 4, { weight: 97.5, reps: 8, rpe: 8.5, isWarmup: false }),

		// ── WORKOUT_4 · Bench Press (sesión activa en curso) ──
		// Solo 3 sets: simula sesión iniciada, aún no terminada
		upsertSet(WORKOUT_4, EXERCISE_BENCH, 1, { weight: 40, reps: 15, rpe: null, isWarmup: true }),
		upsertSet(WORKOUT_4, EXERCISE_BENCH, 2, {
			weight: 82.5,
			reps: 8,
			rpe: 8.0,
			isWarmup: false,
		}),
		upsertSet(WORKOUT_4, EXERCISE_BENCH, 3, { weight: 85, reps: 7, rpe: 8.5, isWarmup: false }),
	]);
}
