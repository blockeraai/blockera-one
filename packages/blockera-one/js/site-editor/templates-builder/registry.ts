/**
 * Central registry of Templates Builder type configs.
 * Add a type folder (e.g. `single/`) and register it via
 * `BuilderTypeRegistration` in `REGISTRATIONS`.
 */

import { archiveRegistration } from './archive';
import { globalFooterRegistration } from './global-footer';
import { globalHeaderRegistration } from './global-header';
import { globalSidebarRegistration } from './global-sidebar';
import { notFoundRegistration } from './not-found';
import { singleRegistration } from './single';
import { hydrateConfig } from './shared/resolve/hydrate-config';
import { registerSectionHeuristics } from './shared/resolve/resolve-state';
import {
	stampDictionaryToMap,
	type StampDictionaryEntry,
	type StampRole,
} from './shared/stamp';
import { SHARED_STAMPS } from './shared/stamps';
import type {
	BuilderTypeRegistration,
	TemplateOptionsConfig,
} from './shared/types';
import { applyTemplateOverrides } from './registry-overrides';

export { applyTemplateOverrides } from './registry-overrides';

export const REGISTRATIONS: BuilderTypeRegistration[] = [
	archiveRegistration,
	singleRegistration,
	notFoundRegistration,
	globalHeaderRegistration,
	globalFooterRegistration,
	globalSidebarRegistration,
];

const ACTIVE_REGISTRATIONS = REGISTRATIONS.filter(
	(entry) => entry.when?.() !== false
);

// Exported for the template-builder lint spec, which cross-checks every
// registered config against the stamp dictionaries and theme markup.
export const CONFIGS: TemplateOptionsConfig[] = ACTIVE_REGISTRATIONS.map(
	(entry) => entry.config
);

/**
 * Stamp dictionaries as authored (`role/id` lists), one entry per source
 * module (shared + per type) so the lint can detect cross-module id/role
 * conflicts and reject malformed entries. Reference data only — runtime
 * roles come from the parsed `role/id:variant` stamp string.
 */
export const STAMP_DICTIONARIES: readonly (readonly StampDictionaryEntry[])[] =
	[SHARED_STAMPS, ...ACTIVE_REGISTRATIONS.map((entry) => entry.stamps)];

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

// Hydrated (catalog-applied) copies, then per-filter overlays. Memoized
// per `${type}` (base hydrate) and `${type}:${filter}` (overlay result).
const HYDRATED = new Map<string, TemplateOptionsConfig>();

export function getHydratedConfig(
	config: TemplateOptionsConfig,
	filter?: string
): TemplateOptionsConfig {
	const cacheKey = filter ? `${config.type}:${filter}` : config.type;
	const cached = HYDRATED.get(cacheKey);
	if (cached) {
		return cached;
	}

	let base = HYDRATED.get(config.type);
	if (!base) {
		base = hydrateConfig(config);
		HYDRATED.set(config.type, base);
	}

	const result = filter ? applyTemplateOverrides(base, filter) : base;
	HYDRATED.set(cacheKey, result);
	return result;
}

/**
 * Whether a builder config owns this purpose-nav filter.
 * Exact id, then `filterPrefix`, then `filterMatch`.
 */
export function matchesFilter(
	config: TemplateOptionsConfig,
	filter: string
): boolean {
	if (config.filters.includes(filter)) {
		return true;
	}
	if (config.filterPrefix && filter.startsWith(config.filterPrefix)) {
		return true;
	}
	if (config.filterMatch?.(filter)) {
		return true;
	}
	return false;
}

/**
 * Resolve options config for a Templates purpose filter. Returns the
 * catalog-hydrated copy (variants filled from the PHP payload), with the
 * filter's `templateOverrides` applied, or null when the filter has no
 * builder (use as the builder gate).
 */
export function getOptionsConfigForFilter(
	filter: string | null | undefined
): TemplateOptionsConfig | null {
	if (!filter) {
		return null;
	}
	for (const config of CONFIGS) {
		if (matchesFilter(config, filter)) {
			return getHydratedConfig(config, filter);
		}
	}
	return null;
}

/**
 * Resolve options config for a Templates purpose-nav part area
 * (`blockera-builder=header|footer|sidebar`). Returns the catalog-hydrated copy, or null.
 */
export function getOptionsConfigForPartsArea(
	area: string | null | undefined
): TemplateOptionsConfig | null {
	if (!area) {
		return null;
	}
	for (const config of CONFIGS) {
		if (config.partsAreas?.includes(area)) {
			return getHydratedConfig(config);
		}
	}
	return null;
}

export const ARCHIVE_OPTIONS_CONFIG = archiveRegistration.config;
export const SINGLE_OPTIONS_CONFIG = singleRegistration.config;
export const NOT_FOUND_OPTIONS_CONFIG = notFoundRegistration.config;
export const GLOBAL_HEADER_OPTIONS_CONFIG = globalHeaderRegistration.config;
export const GLOBAL_FOOTER_OPTIONS_CONFIG = globalFooterRegistration.config;
export const GLOBAL_SIDEBAR_OPTIONS_CONFIG = globalSidebarRegistration.config;
