import type { Prisma } from "@/generated/prisma/client.js";
import {
	ROUTINE_PULL_DAY,
	ROUTINE_PUSH_DAY,
	USER_MAIN,
	WORKOUT_1,
	WORKOUT_2,
	WORKOUT_3,
	WORKOUT_4,
} from "./ids.js";
import { daysAgo, daysAgoPlus, minutesAgo } from "./time.js";

// WORKOUT_1: completado, hace 10 días, Push Day, con notes
// WORKOUT_2: completado, hace 7 días,  Pull Day, sin notes
// WORKOUT_3: completado, hace 3 días,  sin routine, con notes
// WORKOUT_4: ACTIVO (finishedAt null), hace 20 min, Push Day
//
// NOTA: daysAgo(N, M) resta N días Y M minutos → finishedAt queda M minutos
// después de startedAt (ambos en el pasado, finished > started ✓)
export async function seedWorkouts(tx: Prisma.TransactionClient) {
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
}
