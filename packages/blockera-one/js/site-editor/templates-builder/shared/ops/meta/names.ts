/**
 * Gutenberg List View names (`metadata.name`) for Post Meta wrappers and parts.
 * Independent of stamp ids — see STAMPS.md.
 */

import { getMetaItemSuffix, isSpaceFillerId } from './ids';

export const META_ROW_LIST_NAME = 'Post Meta';
export const SPACE_FILLER_LIST_NAME = 'Space Filler';
export const META_SEPARATOR_LIST_NAME = 'Separator';

export const META_PART_LIST_NAMES = {
	icon: 'Meta Icon',
	prefix: 'Meta Prefix',
	suffix: 'Meta Suffix',
	separator: META_SEPARATOR_LIST_NAME,
} as const;

/** Item suffix (after `post-meta-` / `post-meta-2-`) → label before " Meta". */
export const META_ITEM_LABELS: Record<string, string> = {
	'author-name': 'Author Name',
	'post-date': 'Published Date',
	date: 'Date',
	'modified-date': 'Modified Date',
	categories: 'Categories',
	tags: 'Tags',
	'comments-count': 'Comments Count',
	'comments-link': 'Comments Link',
	'time-to-read': 'Time to Read',
	'word-count': 'Word Count',
};

export function getMetaItemListName(sectionId: string): string {
	if (isSpaceFillerId(sectionId)) {
		return SPACE_FILLER_LIST_NAME;
	}
	const suffix = getMetaItemSuffix(sectionId);
	const label = META_ITEM_LABELS[suffix];
	if (!label) {
		return '';
	}
	return `${label} Meta`;
}
