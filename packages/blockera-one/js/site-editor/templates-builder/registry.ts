/**
 * Central registry of Templates Builder type configs.
 * Add a type folder (e.g. `single/`) and register its config here, plus its
 * `<type>/stamps.ts` dictionary in `STAMP_DICTIONARIES`.
 */

import { ARCHIVE_OPTIONS_CONFIG } from './archive/config';
import { ARCHIVE_STAMPS } from './archive/stamps';
import { hydrateConfig } from './shared/hydrate-config';
import { registerSectionHeuristics } from './shared/resolve-state';
import {
	stampDictionaryToMap,
	type StampDictionaryEntry,
	type StampRole,
} from './shared/stamp';
import { SHARED_STAMPS } from './shared/stamps';
import type { TemplateOptionsConfig } from './shared/types';

// Exported for the template-builder lint spec, which cross-checks every
// registered config against the stamp dictionaries and theme markup.
export const CONFIGS: TemplateOptionsConfig[] = [ARCHIVE_OPTIONS_CONFIG];

/**
 * Stamp dictionaries as authored (`role/id` lists), one entry per source
 * module (shared + per type) so the lint can detect cross-module id/role
 * conflicts and reject malformed entries. Reference data only — runtime
 * roles come from the parsed `role/id:variant` stamp string.
 */
export const STAMP_DICTIONARIES: readonly (readonly StampDictionaryEntry[])[] =
	[SHARED_STAMPS, ARCHIVE_STAMPS];

/** Merged id → role map across every dictionary (for lookups/validation). */
export const ALL_STAMPS: Record<string, StampRole> = Object.assign(
	{},
	...STAMP_DICTIONARIES.map(stampDictionaryToMap)
);

// Register each config's stampless section heuristics into the global
// heuristic lookup used by the detection engine.
for (const config of CONFIGS) {
	if (config.sectionHeuristics) {
		registerSectionHeuristics(config.sectionHeuristics);
	}
}

// Hydrated (catalog-applied) copies, memoized per type. The PHP payload is
// static per page load, so hydration runs once per type; the static config
// objects are never mutated.
const HYDRATED = new Map<string, TemplateOptionsConfig>();

function getHydratedConfig(config: TemplateOptionsConfig) {
	let hydrated = HYDRATED.get(config.type);
	if (!hydrated) {
		hydrated = hydrateConfig(config);
		HYDRATED.set(config.type, hydrated);
	}
	return hydrated;
}

/**
 * Resolve options config for a Templates purpose filter. Returns the
 * catalog-hydrated copy (variants filled from the PHP payload), or null
 * when the filter has no builder (use as the builder gate).
 */
export function getOptionsConfigForFilter(
	filter: string | null | undefined
): TemplateOptionsConfig | null {
	if (!filter) {
		return null;
	}
	for (const config of CONFIGS) {
		if (config.filters.includes(filter)) {
			return getHydratedConfig(config);
		}
	}
	return null;
}

export { ARCHIVE_OPTIONS_CONFIG };
