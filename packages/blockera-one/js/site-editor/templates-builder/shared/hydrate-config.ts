/**
 * Hydrate a type config from the PHP variant catalog
 * (`window.blockeraOneTemplateBuilder.catalog`, printed by
 * `Theme\TemplateBuilder`). Controls declare a `catalogPool`; PHP owns the
 * variant lists (child themes filter them via
 * `blockera-one/template-builder/catalog/{type}`), JS owns wiring and ops.
 */

import { applyFilters } from '@wordpress/hooks';

import type {
	CatalogPayload,
	ControlDef,
	PanelGroupDef,
	TemplateOptionsConfig,
	VariantDef,
} from './types';

declare global {
	interface Window {
		blockeraOneTemplateBuilder?: { catalog?: CatalogPayload };
	}
}

/**
 * Every catalog variant key the hydrate layer consumes. Must stay in sync
 * with the variant `properties` in
 * `packages/blockera-one/schemas/template-builder-catalog.schema.json` —
 * the schema is the render contract, so a key JS ignores is a schema bug
 * (enforced by the schema-sync unit test).
 */
export const SUPPORTED_VARIANT_KEYS = [
	'id',
	'label',
	'kind',
	'patternSlug',
	'slug',
	'area',
	'tagName',
	'thumbnail',
	'placement',
	'areas',
	'chromeLayout',
] as const;

/**
 * Read the catalog payload. Plugins/Pro may adjust it via the JS filter;
 * child themes use the PHP filters (no JS build required).
 */
export function getCatalog(): CatalogPayload {
	const catalog =
		(typeof window !== 'undefined' &&
			window.blockeraOneTemplateBuilder?.catalog) ||
		{};

	return applyFilters(
		'blockeraOne.templatesBuilder.catalog',
		catalog
	) as CatalogPayload;
}

/** Copy only supported keys so unknown payload keys never reach the engine. */
function toVariantDef(raw: VariantDef): VariantDef {
	const variant: Record<string, unknown> = {};
	for (const key of SUPPORTED_VARIANT_KEYS) {
		if ((raw as Record<string, unknown>)[key] !== undefined) {
			variant[key] = (raw as Record<string, unknown>)[key];
		}
	}
	return variant as VariantDef;
}

function hydrateControl(
	control: ControlDef,
	pools: CatalogPayload[string]
): ControlDef {
	let next = control;
	if (control.catalogPool) {
		const pool = pools[control.catalogPool] || [];
		const exclude = control.catalogExclude;
		const variants = pool
			.filter((variant) => !exclude?.includes(variant.id))
			.map(toVariantDef);
		next = { ...control, variants };
	}

	if (!next.nestedPanel?.groups?.length) {
		return next;
	}
	return {
		...next,
		nestedPanel: {
			...next.nestedPanel,
			groups: hydrateGroups(next.nestedPanel.groups, pools),
		},
	};
}

function hydrateGroups(
	groups: PanelGroupDef[],
	pools: CatalogPayload[string]
): PanelGroupDef[] {
	return groups.map((group) => ({
		...group,
		headerToggle: group.headerToggle
			? hydrateControl(group.headerToggle, pools)
			: group.headerToggle,
		controls: group.controls.map((control) =>
			hydrateControl(control, pools)
		),
		nestedPanel: group.nestedPanel
			? {
					...group.nestedPanel,
					groups: hydrateGroups(group.nestedPanel.groups, pools),
				}
			: group.nestedPanel,
	}));
}

/**
 * Return a config copy with every `catalogPool` control's `variants` filled
 * from the catalog. Pure — never mutates the static config object.
 *
 * @param config  Static type config (declares pools, never variant lists).
 * @param catalog Catalog payload override (tests); defaults to the window payload.
 */
export function hydrateConfig(
	config: TemplateOptionsConfig,
	catalog?: CatalogPayload
): TemplateOptionsConfig {
	const pools = (catalog || getCatalog())[config.type] || {};

	return {
		...config,
		groups: hydrateGroups(config.groups, pools),
	};
}
