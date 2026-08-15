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

export function isEmptyMergeValue(value: unknown): boolean {
	return value === undefined || value === null || value === '';
}

/**
 * True when `value` is already a Blockera spacing box (`margin` / `padding`
 * sides). Used so a swap reapply cannot nest that box into `margin.top`.
 */
export function isSpacingBox(value: unknown): boolean {
	return isPlainObject(value) && ('margin' in value || 'padding' in value);
}

const EMPTY_BORDER_SIDE = { width: '', style: '', color: '' };

/** True when a BorderControl side has a width or color. */
export function isBorderSideAssigned(value: unknown): boolean {
	if (!isPlainObject(value)) {
		return false;
	}
	const width = String(value.width ?? '');
	const color = String(value.color ?? '');
	const widthEmpty = !width || width === '0' || width === '0px';
	return !widthEmpty || color !== '';
}

/**
 * Write one side of the inspector `blockeraBorder` box (`type: custom`).
 */
export function mergeBorderSide(
	current: unknown,
	side: string,
	nextSide: unknown
): Record<string, unknown> {
	const next = isPlainObject(current)
		? clonePlain(current)
		: {
				type: 'custom',
				all: { ...EMPTY_BORDER_SIDE },
				top: { ...EMPTY_BORDER_SIDE },
				right: { ...EMPTY_BORDER_SIDE },
				bottom: { ...EMPTY_BORDER_SIDE },
				left: { ...EMPTY_BORDER_SIDE },
			};
	next.type = 'custom';
	next[side] = isPlainObject(nextSide) ? nextSide : { ...EMPTY_BORDER_SIDE };
	return next;
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
