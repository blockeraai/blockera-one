/**
 * Post Meta row / item / space-filler stamp ids.
 */

import { STAMP_IDS } from '../../stamp-ids';

export function isMetaRowId(id: string): boolean {
	return id === STAMP_IDS.postMeta || id === STAMP_IDS.postMeta2;
}

export function getMetaRowIdForSection(id: string): string | null {
	if (isMetaRowId(id)) {
		return id;
	}
	// `post-meta-2-*` must win: it is a prefix of the `post-meta-*` match.
	if (id.startsWith(`${STAMP_IDS.postMeta2}-`)) {
		return STAMP_IDS.postMeta2;
	}
	if (id.startsWith(`${STAMP_IDS.postMeta}-`)) {
		return STAMP_IDS.postMeta;
	}
	return null;
}

export function isSpaceFillerId(id: string): boolean {
	return id.includes('space-filler');
}

/** Item wrapper (not the row, not a space filler). */
export function isPostMetaItemId(id: string): boolean {
	return (
		!!getMetaRowIdForSection(id) && !isMetaRowId(id) && !isSpaceFillerId(id)
	);
}

export function getMetaItemSuffix(sectionId: string): string {
	const meta2Prefix = `${STAMP_IDS.postMeta2}-`;
	const metaPrefix = `${STAMP_IDS.postMeta}-`;
	if (sectionId.startsWith(meta2Prefix)) {
		return sectionId.slice(meta2Prefix.length);
	}
	if (sectionId.startsWith(metaPrefix)) {
		return sectionId.slice(metaPrefix.length);
	}
	return sectionId;
}
