import { PrismaService } from "@/prisma/prisma.service.js";
import { seedExercises } from "./seeds/exercises.seed.js";
import { seedRoutines } from "./seeds/routines.seed.js";
import { seedSets } from "./seeds/sets.seed.js";
import { seedUsers } from "./seeds/users.seed.js";
import { seedWorkouts } from "./seeds/workouts.seed.js";

const prisma = new PrismaService();

async function main() {
	await prisma.$transaction(
		async (tx) => {
			await seedUsers(tx);
			await seedExercises(tx);
			await seedRoutines(tx);
			await seedWorkouts(tx);
			await seedSets(tx);
		},
		// El default de Prisma (5s) queda corto contra una base remota como Neon,
		// donde cada round trip suma latencia.
		{ timeout: 30_000 },
	);
}

/** Cuenta filas reales para que el resumen no se desincronice de los seeders. */
async function summary() {
	const [users, exercises, routines, routineExercises, workouts, sets] = await Promise.all([
		prisma.user.count(),
		prisma.exercise.count(),
		prisma.routine.count(),
		prisma.routineExercise.count(),
		prisma.workout.count(),
		prisma.set.count(),
	]);

	return (
		"✅ Seed completado\n" +
		`   👤 ${users} usuarios\n` +
		`   💪 ${exercises} ejercicios\n` +
		`   📋 ${routines} rutinas · ${routineExercises} routine_exercises\n` +
		`   🏋️  ${workouts} workouts\n` +
		`   📊 ${sets} sets`
	);
}

main()
	.then(async () => {
		console.log(await summary());
	})
	.catch((e) => {
		console.error(e);
		// exitCode en vez de exit(): deja que el event loop drene, así $disconnect
		// alcanza a correr y stdout se vacía antes de salir.
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
