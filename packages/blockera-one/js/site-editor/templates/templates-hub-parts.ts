/**
 * Canonical site template parts for the General Area Hub.
 */

import type { PartAreaId } from './constants';
import type { TemplateLike } from './templates-matchers';

/**
 * Whether the theme exposes a sidebar part (slug or area).
 * blockera-one registers sidebar as uncategorized + slug `sidebar`.
 */
export function hasRegisteredSidebarPart(parts: TemplateLike[]): boolean {
	return parts.some(
		(part) => part.slug === 'sidebar' || part.area === 'sidebar'
	);
}

/** Site-wide part for an area (exact slug `header` / `footer` / `sidebar`). */
export function findCanonicalPart(
	area: PartAreaId,
	parts: TemplateLike[]
): TemplateLike | undefined {
	return parts.find((part) => part.slug === area);
}
