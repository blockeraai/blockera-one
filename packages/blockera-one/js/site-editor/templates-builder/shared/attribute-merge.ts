/**
 * Nested-key merge for Blockera object attributes (spacing sides, etc.).
 * Pure: no React, no WP data.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function clonePlain(value: unknown): Record<string, unknown> {
	if (!isPlainObject(value)) {
		return {};
	}
	return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function getAtDotPath(source: unknown, path: string): unknown {
	if (!isPlainObject(source) || !path) {
		return undefined;
	}
	const parts = path.split('.');
	let cursor: unknown = source;
	for (let i = 0; i < parts.length; i++) {
		if (!isPlainObject(cursor)) {
			return undefined;
		}
		cursor = cursor[parts[i]];
	}
	return cursor;
}

function setAtDotPath(
	target: Record<string, unknown>,
	path: string,
	value: unknown
): void {
	const parts = path.split('.');
	let cursor: Record<string, unknown> = target;
	for (let i = 0; i < parts.length - 1; i++) {
		const key = parts[i];
		const next = cursor[key];
		if (!isPlainObject(next)) {
			cursor[key] = {};
		} else {
			cursor[key] = { ...next };
		}
		cursor = cursor[key] as Record<string, unknown>;
	}
	cursor[parts[parts.length - 1]] = value;
}

function isEmptyMergeValue(value: unknown): boolean {
	return value === undefined || value === null || value === '';
}

/**
 * Clone `current` and set every merge key to `value`. Missing intermediate
 * objects are created. Non-objects start from `{}`.
 */
export function mergeAttributeKeys(
	current: unknown,
	keys: string[],
	value: unknown
): Record<string, unknown> {
	const next = clonePlain(current);
	for (let i = 0; i < keys.length; i++) {
		setAtDotPath(next, keys[i], value);
	}
	return next;
}

/**
 * First non-empty merge key on `current` (for InputControl display).
 */
export function pickMergedAttributeValue(
	current: unknown,
	keys: string[]
): unknown {
	for (let i = 0; i < keys.length; i++) {
		const value = getAtDotPath(current, keys[i]);
		if (!isEmptyMergeValue(value)) {
			return value;
		}
	}
	return '';
}
