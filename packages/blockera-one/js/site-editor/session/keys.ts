/**
 * Entity-scoped session keys. Isolation is the prefix, not bag clearing.
 */

import { innerOrderFreezeKey } from '../templates-builder/shared/sortable-order-freeze';
import type { InnerOrderRule } from '../templates-builder/shared/types';

export function sessionEntityKey(
	entityPostType: string | undefined,
	templateId: string | number | null | undefined,
	slug?: string | null
): string {
	const kind = entityPostType || 'wp_template';
	if (templateId !== null && templateId !== undefined && templateId !== '') {
		return `${kind}:${String(templateId)}`;
	}
	if (slug) {
		return `${kind}:${slug}`;
	}
	return `${kind}:unknown`;
}

export function sessionOrderKey(entity: string, freezeKey: string): string {
	return `order:${entity}::${freezeKey}`;
}

export function sessionOrderKeyForRule(
	entity: string,
	rule: InnerOrderRule
): string {
	return sessionOrderKey(entity, innerOrderFreezeKey(rule));
}

export function sessionMetaParkKey(
	entity: string,
	within: string,
	sectionId: string
): string {
	return `metaPark:${entity}::${within}::${sectionId}`;
}

export function sessionSwapKey(
	entity: string,
	within: string,
	sectionId: string,
	variantId: string
): string {
	return `swap:${entity}::${within}::${sectionId}:${variantId}`;
}

export function sessionSwapPartKey(
	entity: string,
	area: string,
	variantId: string
): string {
	return `swapPart:${entity}::${area}:${variantId}`;
}

/** Current layout after restoring a saved (not session-edited) swap park. */
export function sessionSwapCleanCurrentKey(entity: string): string {
	return `swapCleanCurrent:${entity}`;
}
