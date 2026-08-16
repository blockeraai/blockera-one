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
	'section/page-header',
	'section/page-header-title',
	'section/page-header-description',
	'section/page-header-breadcrumbs',
	'section/posts-listing',
	'section/pagination',
	'section/pagination-previous',
	'section/pagination-next',
	'section/pagination-numbers',
	'section/sidebar',
	'container/layout-columns',
	'container/content-column',
	'container/sidebar-column',
	'container/elements',
];
