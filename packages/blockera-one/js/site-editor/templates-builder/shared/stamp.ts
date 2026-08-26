/**
 * Stamp format: `metadata.blockeraOne.stamp` is a string `role/id` or
 * `role/id:variant` (e.g. "section/posts-listing:list", "area/content").
 * The role is part of the stamp itself so theme markup is self-describing —
 * no runtime role registry. Ids must still be globally unique across all
 * template-type stamp dictionaries (enforced by the pattern lint spec).
 */

export type StampRole = 'layout' | 'section' | 'area' | 'container';

/** Closed role enum, ordered for stable lint output. */
export const STAMP_ROLES: readonly StampRole[] = [
	'layout',
	'section',
	'area',
	'container',
];

export type Stamp = {
	role: StampRole;
	id: string;
	variant?: string;
};

/**
 * Detectable stamp grammar: `role/id` with an optional `:variant` suffix.
 * `/` binds the role to the id; `:` binds the variant to the id.
 */
const STAMP_PATTERN =
	/^(layout|section|area|container)\/([a-z0-9-]+)(?::([a-z0-9-]+))?$/;

export function parseStamp(value: unknown): Stamp | null {
	if (typeof value !== 'string') {
		return null;
	}
	const match = STAMP_PATTERN.exec(value);
	if (!match) {
		return null;
	}
	const stamp: Stamp = {
		role: match[1] as StampRole,
		id: match[2],
	};
	if (match[3]) {
		stamp.variant = match[3];
	}
	return stamp;
}

export function formatStamp(
	role: StampRole,
	id: string,
	variant?: string | null
): string {
	return variant ? `${role}/${id}:${variant}` : `${role}/${id}`;
}

/**
 * Dictionary entry shape: `role/id` only (no `:variant`). Used by the
 * source stamp lists in `shared/stamps.ts` and `<type>/stamps.ts`.
 */
export type StampDictionaryEntry = `${StampRole}/${string}`;

/**
 * Convert a `role/id` dictionary list into an id → role map for lookups.
 * Malformed or variant-bearing entries are skipped — the lint spec rejects
 * them against the raw lists.
 */
export function stampDictionaryToMap(
	entries: readonly string[]
): Record<string, StampRole> {
	const map: Record<string, StampRole> = {};
	for (const entry of entries) {
		const stamp = parseStamp(entry);
		if (!stamp || stamp.variant) {
			continue;
		}
		map[stamp.id] = stamp.role;
	}
	return map;
}
