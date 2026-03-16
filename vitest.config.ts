import { resolve } from "node:path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		swc.vite({
			module: { type: "es6" },
		}),
	],
	test: {
		projects: [
			{
				resolve: {
					alias: {
						"@": resolve(__dirname, "src"),
					},
				},
				test: {
					name: "unit",
					globals: true,
					environment: "node",
					include: ["src/**/__tests__/**/*.spec.ts"],
				},
			},
			{
				resolve: {
					alias: {
						"@": resolve(__dirname, "src"),
					},
				},
				test: {
					name: "e2e",
					globals: true,
					environment: "node",
					include: ["test/**/*.e2e-spec.ts"],
					fileParallelism: false,
					maxWorkers: 1,
					isolate: false,
				},
			},
		],
		coverage: {
			provider: "v8",
			include: ["src/**/*.service.ts"],
			exclude: ["src/prisma/**", "src/main.ts", "src/app.module.ts"],
		},
	},
});
