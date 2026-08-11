import bcrypt from "bcrypt";
import type { Prisma } from "@/generated/prisma/client.js";
import { USER_MAIN } from "./ids.js";

export async function seedUsers(tx: Prisma.TransactionClient) {
	const passwordHash = await bcrypt.hash("Password123!", 10);

	await tx.user.upsert({
		where: { id: USER_MAIN },
		update: {},
		create: {
			id: USER_MAIN,
			email: "joseprivera@overload.dev",
			name: "Josep Rivera",
			passwordHash,
			isActive: true,
			emailVerified: false,
		},
	});
}
