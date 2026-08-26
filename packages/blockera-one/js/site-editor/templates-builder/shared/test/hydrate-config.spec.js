/**
 * hydrate-config: PHP catalog → config variants, plus the schema-sync
 * contract (every schema variant key is consumed by hydrate, and vice
 * versa) against the shared JSON fixture also asserted by PHPUnit
 * (`TemplateBuilderTest::test_default_catalog_matches_shared_fixture`).
 */

import {
	getCatalog,
	hydrateConfig,
	SUPPORTED_VARIANT_KEYS,
} from '../resolve/hydrate-config';

const schema = require('../../../../../schemas/template-builder-catalog.schema.json');
const rawFixture = require('../../../../../php/tests/fixtures/template-builder-catalog.json');

/** Fixture with the PHPUnit theme-uri placeholder replaced. */
const fixture = JSON.parse(
	JSON.stringify(rawFixture).replace(
		/\{\{theme_file_uri\}\}/g,
		'https://example.test/wp-content/themes/blockera-one'
	)
);

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function makeConfig(overrides = {}) {
	return {
		type: 'archive',
		filters: ['archive'],
		layoutId: 'main',
		groups: [
			{
				id: 'page-layout',
				title: 'Posts Loop',
				headerToggle: {
					id: 'sidebar',
					type: 'toggle',
					label: 'Sidebar',
					target: { kind: 'layout', id: 'main' },
					operation: 'transplantLayout',
					catalogPool: 'layout',
				},
				controls: [
					{
						id: 'posts-template',
						type: 'layout-picker',
						label: 'Posts Template',
						target: { kind: 'section', id: 'posts-listing' },
						operation: 'swapSection',
						catalogPool: 'posts-listing',
					},
					{
						id: 'posts-per-page',
						type: 'number',
						label: 'Number of posts',
						target: { kind: 'setting', id: 'posts_per_page' },
						operation: 'setTemplateSetting',
					},
				],
				nestedPanel: {
					id: 'sidebar',
					title: 'Sidebar',
					groups: [
						{
							id: 'sidebar-layout',
							title: 'Layout',
							controls: [
								{
									id: 'sidebar-position',
									type: 'layout-picker',
									label: 'Sidebar Position',
									target: {
										kind: 'layout',
										id: 'main',
									},
									operation: 'transplantLayout',
									catalogPool: 'layout',
									catalogExclude: ['no-sidebar'],
								},
							],
						},
					],
				},
			},
		],
		...overrides,
	};
}

describe('hydrateConfig', () => {
	afterEach(() => {
		delete window.blockeraOneTemplateBuilder;
	});

	it('fills variants from the catalog pool (headerToggle, controls, nested panels)', () => {
		const config = makeConfig();
		const hydrated = hydrateConfig(config, fixture);

		const group = hydrated.groups[0];
		expect(group.headerToggle.variants.map((v) => v.id)).toEqual([
			'no-sidebar',
			'sidebar-left',
			'sidebar-right',
		]);
		expect(group.controls[0].variants.map((v) => v.id)).toEqual([
			'list',
			'grid-2',
			'grid-3',
			'full-width',
		]);
		// catalogExclude hides the toggle-off layout on the nested picker.
		expect(
			group.nestedPanel.groups[0].controls[0].variants.map((v) => v.id)
		).toEqual(['sidebar-left', 'sidebar-right']);
	});

	it('leaves controls without a catalogPool untouched and never mutates the input', () => {
		const config = makeConfig();
		const snapshot = JSON.parse(JSON.stringify(config));
		const hydrated = hydrateConfig(config, fixture);

		expect(hydrated.groups[0].controls[1].variants).toBeUndefined();
		expect(config).toEqual(snapshot);
		expect(hydrated).not.toBe(config);
	});

	it('hydrates to empty variant lists when the pool is missing', () => {
		const hydrated = hydrateConfig(makeConfig(), { archive: {} });
		expect(hydrated.groups[0].controls[0].variants).toEqual([]);
	});

	it('reads the window payload by default', () => {
		window.blockeraOneTemplateBuilder = { catalog: fixture };
		const hydrated = hydrateConfig(makeConfig());
		expect(hydrated.groups[0].controls[0].variants).toHaveLength(4);
		expect(getCatalog()).toEqual(fixture);
	});

	it('drops unknown variant keys from the payload', () => {
		const hydrated = hydrateConfig(makeConfig(), {
			archive: {
				'posts-listing': [
					{
						id: 'list',
						label: 'List',
						patternSlug:
							'blockera-one/builder-archive-listing-list',
						rogueKey: 'nope',
					},
				],
			},
		});
		expect(hydrated.groups[0].controls[0].variants[0]).toEqual({
			id: 'list',
			label: 'List',
			patternSlug: 'blockera-one/builder-archive-listing-list',
		});
	});
});

describe('catalog schema sync (render contract)', () => {
	const definitionKeys = new Set([
		...Object.keys(schema.definitions.patternVariant.properties),
		...Object.keys(schema.definitions.templatePartVariant.properties),
		...Object.keys(schema.definitions.disabledVariant.properties),
	]);

	it('hydrate supports every variant key in the schema', () => {
		for (const key of definitionKeys) {
			expect(SUPPORTED_VARIANT_KEYS).toContain(key);
		}
	});

	it('the schema declares every key hydrate supports', () => {
		for (const key of SUPPORTED_VARIANT_KEYS) {
			expect(definitionKeys.has(key)).toBe(true);
		}
	});
});

describe('shared fixture obeys the schema contract', () => {
	const defs = schema.definitions;

	function definitionFor(variant) {
		if (variant.kind === 'templatePart') {
			return defs.templatePartVariant;
		}
		if (variant.disabled && !variant.patternSlug) {
			return defs.disabledVariant;
		}
		return defs.patternVariant;
	}

	it('every fixture variant matches its kind definition (keys, required, enums, ids)', () => {
		for (const [type, pools] of Object.entries(fixture)) {
			expect(type).toMatch(KEBAB);
			for (const [poolId, variants] of Object.entries(pools)) {
				expect(poolId).toMatch(KEBAB);
				expect(variants.length).toBeGreaterThan(0);
				for (const variant of variants) {
					const def = definitionFor(variant);
					const allowed = Object.keys(def.properties);
					for (const key of Object.keys(variant)) {
						expect(allowed).toContain(key);
					}
					for (const required of def.required) {
						expect(variant[required]).toBeDefined();
					}
					expect(variant.id).toMatch(KEBAB);
					if (variant.placement) {
						expect([
							'before',
							'after',
							'inside-start',
							'inside-end',
						]).toContain(variant.placement.position);
					}
					if (variant.chromeLayout) {
						expect(['stacked', 'vertical-rail']).toContain(
							variant.chromeLayout
						);
					}
				}
			}
		}
	});
});
