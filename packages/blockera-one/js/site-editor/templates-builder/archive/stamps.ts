/**
 * Archive-only stamp dictionary. Ids must be globally unique across all
 * template types (the pattern lint spec checks every dictionary for
 * conflicts). Cross-type ids (`layout/main`, `section/page-header`,
 * `area/content`, `section/header`, …) live in `shared/stamps.ts`. See
 * STAMPS.md.
 *
 * Entries are `role/id` (same grammar as markup, without a variant).
 */

import type { StampDictionaryEntry } from '../shared/stamp';

export const ARCHIVE_STAMPS: readonly StampDictionaryEntry[] = [
	'section/posts-listing',
	'container/elements',
	'container/loop-item-content',
	'container/loop-item-media',
];
