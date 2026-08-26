/**
 * Load / persist the Post Meta parked-chrome overlay for one row.
 */

import { sessionMetaParkKey, type EditorSessionApi } from '../../../../session';
import type { ControlDef } from '../../types';
import { getMetaRowIdForSection, isMetaRowId } from './ids';
import type { MetaParkOverlay } from './parts';

export function controlWithin(control: ControlDef): string {
	return control.innerOrder?.within || '';
}

export function metaParkRowId(control: ControlDef): string | null {
	const id = control.target.id;
	if (isMetaRowId(id)) {
		return id;
	}
	return getMetaRowIdForSection(id);
}

export function loadMetaParkOverlay(
	session: EditorSessionApi | undefined,
	entityKey: string | undefined,
	control: ControlDef
): { key: string | null; overlay: MetaParkOverlay } {
	const rowId = metaParkRowId(control);
	if (!session || !entityKey || !rowId) {
		return { key: null, overlay: {} };
	}
	const key = sessionMetaParkKey(entityKey, controlWithin(control), rowId);
	const stored = session.get<MetaParkOverlay>(key);
	return {
		key,
		overlay: stored && typeof stored === 'object' ? { ...stored } : {},
	};
}

export function saveMetaParkOverlay(
	session: EditorSessionApi | undefined,
	key: string | null,
	overlay: MetaParkOverlay
): void {
	if (!session || !key) {
		return;
	}
	if (!Object.keys(overlay).length) {
		session.delete(key);
		return;
	}
	session.set(key, overlay);
}
