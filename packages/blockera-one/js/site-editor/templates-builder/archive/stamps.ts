/**
 * Archive-only stamp dictionary. Ids must be globally unique across all
 * template types (the pattern lint spec checks every dictionary for
 * conflicts). Cross-type ids (`area/content`, `section/header`, …) live in
 * `shared/stamps.ts`.
 *
 * Entries are `role/id` (same grammar as markup, without a variant).
 */

import type { StampDictionaryEntry } from '../shared/stamp';

export const ARCHIVE_STAMPS: readonly StampDictionaryEntry[] = [
	'layout/archive-body',
	'section/page-title',
	'section/page-title-title',
	'section/page-title-description',
	'section/page-title-breadcrumbs',
	'section/posts-listing',
	'section/pagination',
	'section/sidebar',
	'container/layout-columns',
	'container/content-column',
	'container/sidebar-column',
	'container/elements',
];
