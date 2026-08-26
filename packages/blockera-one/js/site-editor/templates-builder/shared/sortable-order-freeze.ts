/**
 * Stable identity for a logical sortable list (not group.id / URL segment).
 */

import type { InnerOrderRule } from './types';

export function innerOrderFreezeKey(rule: InnerOrderRule): string {
	const buckets = (rule.bucketParents || []).join(',');
	const ids = (rule.ids || []).join(',');
	return `${rule.within || ''}::${rule.parentId}::${buckets}::${ids}`;
}
