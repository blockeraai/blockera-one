/**
 * Dot-path read on a block attributes object.
 */

export function getAttributeAtPath(
	attributes: Record<string, unknown> | undefined,
	path: string
): unknown {
	if (!attributes || !path) {
		return undefined;
	}
	const parts = path.split('.');
	let cursor: unknown = attributes;
	for (let i = 0; i < parts.length; i++) {
		if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) {
			return undefined;
		}
		cursor = (cursor as Record<string, unknown>)[parts[i]];
	}
	return cursor;
}
