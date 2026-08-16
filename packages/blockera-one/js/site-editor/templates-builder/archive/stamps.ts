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
	'section/post-featured-image',
	'section/post-title',
	'section/post-excerpt',
	'section/post-content',
	'section/post-read-more',
	'section/post-meta',
	'section/post-meta-2',
	'section/post-meta-author-name',
	'section/post-meta-comments-count',
	'section/post-meta-comments-link',
	'section/post-meta-date',
	'section/post-meta-post-date',
	'section/post-meta-modified-date',
	'section/post-meta-categories',
	'section/post-meta-tags',
	'section/post-meta-time-to-read',
	'section/post-meta-word-count',
	'section/post-meta-2-author-name',
	'section/post-meta-2-comments-count',
	'section/post-meta-2-comments-link',
	'section/post-meta-2-date',
	'section/post-meta-2-post-date',
	'section/post-meta-2-modified-date',
	'section/post-meta-2-categories',
	'section/post-meta-2-tags',
	'section/post-meta-2-time-to-read',
	'section/post-meta-2-word-count',
	'section/pagination',
	'section/pagination-previous',
	'section/pagination-next',
	'section/pagination-numbers',
	'section/sidebar',
	'container/layout-columns',
	'container/content-column',
	'container/sidebar-column',
	'container/elements',
	'container/loop-item-content',
	'container/loop-item-media',
];
