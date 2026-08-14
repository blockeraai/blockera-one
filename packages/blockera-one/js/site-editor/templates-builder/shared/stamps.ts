/**
 * Shared stamp dictionary: ids the shared ops/detection engine hardcodes,
 * valid across every template type. Per-type ids live in
 * `<type>/stamps.ts`; `registry.ts` aggregates all dictionaries.
 *
 * Entries are `role/id` (same grammar as markup, without a variant) so the
 * list reads like the stamps in templates/patterns. Reference data only —
 * runtime roles come from the parsed stamp string. The pattern lint spec
 * (`shared/test/template-builder.spec.js`) validates theme markup and the
 * type configs against these lists.
 */

import type { StampDictionaryEntry } from './stamp';

export const SHARED_STAMPS: readonly StampDictionaryEntry[] = [
	// Areas the layout ops fill with carried-over content.
	'area/content',
	'area/sidebar-area',
	// Empty body column in the vertical-rail pattern the chrome-rail op
	// fills with the live layout.
	'area/rail-body-area',
	// Vertical-rail columns container around header + body.
	'container/chrome-rail',
	// Site chrome sections handled by the shared chrome ops.
	'section/header',
	'section/footer',
];
