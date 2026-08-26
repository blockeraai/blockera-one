/**
 * After restoring a saved (not session-edited) swap park, the entity is
 * dirty from the swap itself. Tree compare vs catalog is unreliable after
 * serialize→parse, so a marker names the current section+variant as clean.
 * Any non-swap applyOperation clears it so a real edit can show the badge.
 */

import { sessionSwapCleanCurrentKey } from './keys';
import type { EditorSessionApi } from './bag';

export type SwapCleanCurrent = {
	sectionId: string;
	variantId: string;
};

export function readSwapCleanCurrent(
	session: EditorSessionApi | undefined,
	entityKey: string | undefined
): SwapCleanCurrent | undefined {
	if (!session || !entityKey) {
		return undefined;
	}
	const raw = session.get<SwapCleanCurrent>(
		sessionSwapCleanCurrentKey(entityKey)
	);
	if (
		!raw ||
		typeof raw !== 'object' ||
		typeof raw.sectionId !== 'string' ||
		typeof raw.variantId !== 'string'
	) {
		return undefined;
	}
	return raw;
}

export function swapCleanCurrentMatches(
	marker: SwapCleanCurrent | undefined,
	sectionId: string,
	variantId: string | null | undefined
): boolean {
	return !!(
		marker &&
		variantId &&
		marker.sectionId === sectionId &&
		marker.variantId === variantId
	);
}

export function setSwapCleanCurrent(
	session: EditorSessionApi | undefined,
	entityKey: string | undefined,
	sectionId: string,
	variantId: string,
	sessionEdited: boolean
): void {
	if (!session || !entityKey) {
		return;
	}
	const key = sessionSwapCleanCurrentKey(entityKey);
	if (sessionEdited) {
		session.delete(key);
		return;
	}
	session.set(key, { sectionId, variantId });
}

export function clearSwapCleanCurrent(
	session: EditorSessionApi | undefined,
	entityKey: string | undefined
): void {
	if (!session || !entityKey) {
		return;
	}
	session.delete(sessionSwapCleanCurrentKey(entityKey));
}
