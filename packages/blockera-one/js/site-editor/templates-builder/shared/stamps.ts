/**
 * Shared stamp dictionary: ids the shared ops/detection engine hardcodes,
 * plus cross-type standards (layout/main, page-header, pagination, post-*, chrome).
 * Per-type ids live in `<type>/stamps.ts`; `registry.ts` aggregates all
 * dictionaries. See STAMPS.md for naming rules.
 *
 * Entries are `role/id` (same grammar as markup, without a variant) so the
 * list reads like the stamps in templates/patterns. Reference data only —
 * runtime roles come from the parsed stamp string. The pattern lint spec
 * (`shared/test/template-builder.spec.js`) validates theme markup and the
 * type configs against these lists.
 */

import type { StampDictionaryEntry } from './stamp';

export const SHARED_STAMPS: readonly StampDictionaryEntry[] = [
	// wp_template layout root (every template type).
	'layout/main',
	// In-template title band (not the site header part).
	'section/page-header',
	'section/page-header-title',
	'section/page-header-description',
	'section/page-header-breadcrumbs',
	// Query pagination (archive, search, homepage, and other listings).
	'section/pagination',
	'section/pagination-previous',
	'section/pagination-next',
	'section/pagination-numbers',
	// Post/page pieces (loop items, single post, and single page).
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
	// Areas the layout ops fill with carried-over content.
	'area/content',
	'area/sidebar-area',
	// Empty body column in the vertical-rail pattern the chrome-rail op
	// fills with the live layout.
	'area/rail-body-area',
	// Vertical-rail columns container around header + body.
	'container/chrome-rail',
	// Content + sidebar column frame (archive, single, page, …).
	'container/layout-columns',
	'container/content-column',
	'container/sidebar-column',
	// Site chrome sections handled by the shared chrome ops.
	'section/header',
	'section/footer',
	'section/sidebar',
];
