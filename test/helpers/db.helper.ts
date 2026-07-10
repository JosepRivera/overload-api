import type { PrismaService } from "@/prisma/prisma.service.ts";

export async function cleanDatabase(prisma: PrismaService): Promise<void> {
	await prisma.$executeRaw`TRUNCATE TABLE sets, workouts, routine_exercises, routines, exercises, refresh_tokens, users CASCADE`;
}
