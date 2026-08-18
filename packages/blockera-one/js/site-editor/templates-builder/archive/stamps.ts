/**
 * Archive-only stamp dictionary. Ids must be globally unique across all
 * template types (the pattern lint spec checks every dictionary for
 * conflicts). Cross-type ids (`layout/main`, `section/page-header`,
 * `section/posts-listing`, `area/content`, `section/header`, …) live in
 * `shared/stamps.ts`. See STAMPS.md.
 *
 * Entries are `role/id` (same grammar as markup, without a variant).
 * Archive currently has no type-only stamps — listing, page-header,
 * pagination, post pieces, and inner slots are shared.
 */

import type { StampDictionaryEntry } from '../shared/stamp';

export const ARCHIVE_STAMPS: readonly StampDictionaryEntry[] = [];
