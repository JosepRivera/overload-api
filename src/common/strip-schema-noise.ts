const SAFE_INTEGER_BOUNDS = new Set([Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);

export function stripSchemaNoise(node: unknown): void {
	if (Array.isArray(node)) {
		for (const item of node) stripSchemaNoise(item);
		return;
	}
	if (node === null || typeof node !== "object") return;

	const schema = node as Record<string, unknown>;
	if (typeof schema.format === "string" && typeof schema.pattern === "string") {
		delete schema.pattern;
	}
	if (schema.type === "integer") {
		for (const bound of ["minimum", "maximum"] as const) {
			if (typeof schema[bound] === "number" && SAFE_INTEGER_BOUNDS.has(schema[bound])) {
				delete schema[bound];
			}
		}
	}
	for (const value of Object.values(schema)) stripSchemaNoise(value);
}
