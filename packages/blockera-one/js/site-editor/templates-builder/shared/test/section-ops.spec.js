/**
 * section-ops.ts: leaf-section swap / toggle / attribute set. Parse is
 * injected (html keys map to internal fixture trees) — no WP, no theme
 * patterns.
 */

import {
	orderInnerSections,
	placeSection,
	setSectionAttribute,
	setSectionBlockStyle,
	swapSection,
	toggleSection,
} from '../operations';
import { findByStamp, getAtPath } from '../tree';

const SECTION_ID = 'posts-listing';

function block(name, attributes = {}, innerBlocks = []) {
	return { name, attributes, innerBlocks };
}

function stamped(name, stampValue, attributes = {}, innerBlocks = []) {
	return block(
		name,
		{ ...attributes, metadata: { blockeraOne: stampValue } },
		innerBlocks
	);
}

/** html key → fixture tree; mirrors the injected-parse test convention. */
const MARKUP = {
	'listing-grid': [
		stamped('core/query', `section/${SECTION_ID}:grid-2`, {
			query: {
				inherit: true,
				perPage: 12,
				order: 'desc',
				orderBy: 'date',
			},
		}),
	],
	'title-simple': [stamped('core/group', 'section/page-title:simple')],
	'title-banner': [
		stamped('core/group', 'section/page-title:banner', {
			blockeraFlexLayout: {
				value: {
					direction: 'column',
					alignItems: 'center',
					justifyContent: 'center',
				},
			},
		}),
	],
	empty: [],
};

const ctx = {
	parse: (html) => JSON.parse(JSON.stringify(MARKUP[html] ?? [])),
	serialize: () => '',
};

const GRID_VARIANT = { id: 'grid-2', label: 'Grid 2', html: 'listing-grid' };
const KNOWN = [{ id: 'list', label: 'List' }, GRID_VARIANT];

function findStamp(blocks, id) {
	return findByStamp(blocks, (stamp) => stamp?.id === id);
}

describe('swapSection', () => {
	it('replaces the section without carrying Blockera extension attributes', () => {
		const tree = [
			stamped('core/query', `section/${SECTION_ID}:list`, {
				className: 'user-class',
				style: { color: { text: '#111' } },
				blockeraFontColor: '#abc',
			}),
		];
		const next = swapSection(
			tree,
			{
				sectionId: SECTION_ID,
				targetVariant: GRID_VARIANT,
				knownVariants: KNOWN,
			},
			ctx
		);

		const swapped = next[0];
		expect(swapped.attributes.metadata.blockeraOne).toBe(
			`section/${SECTION_ID}:grid-2`
		);
		// Default: previous blockera* attrs must not overlay the new pattern.
		expect(swapped.attributes.blockeraFontColor).toBeUndefined();
		// Previous design look (WP native) must not carry either.
		expect(swapped.attributes.className).toBeUndefined();
		expect(swapped.attributes.style).toBeUndefined();
	});

	it('does not overlay previous flex layout onto the target pattern', () => {
		const BANNER = {
			id: 'banner',
			label: 'Banner',
			html: 'title-banner',
		};
		const tree = [
			stamped('core/group', 'section/page-title:simple', {
				blockeraFlexLayout: {
					value: {
						direction: 'column',
						alignItems: 'flex-start',
						justifyContent: 'center',
					},
				},
			}),
		];
		const next = swapSection(
			tree,
			{
				sectionId: 'page-title',
				targetVariant: BANNER,
				knownVariants: [{ id: 'simple', label: 'Simple' }, BANNER],
			},
			ctx
		);

		expect(next[0].attributes.blockeraFlexLayout).toEqual({
			value: {
				direction: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			},
		});
	});

	it('carries Blockera extension attributes when preserveBlockeraExtensions is set', () => {
		const tree = [
			stamped('core/query', `section/${SECTION_ID}:list`, {
				className: 'user-class',
				blockeraFontColor: '#abc',
			}),
		];
		const next = swapSection(
			tree,
			{
				sectionId: SECTION_ID,
				targetVariant: GRID_VARIANT,
				knownVariants: KNOWN,
				preserveBlockeraExtensions: true,
			},
			ctx
		);

		expect(next[0].attributes.blockeraFontColor).toBe('#abc');
		expect(next[0].attributes.className).toBeUndefined();
	});

	it('preserves the query envelope when preserveQuery is set', () => {
		const tree = [
			stamped('core/query', `section/${SECTION_ID}:list`, {
				query: {
					inherit: false,
					perPage: 5,
					order: 'asc',
					orderBy: 'title',
				},
			}),
		];
		const next = swapSection(
			tree,
			{
				sectionId: SECTION_ID,
				targetVariant: GRID_VARIANT,
				knownVariants: KNOWN,
				preserveQuery: true,
			},
			ctx
		);

		expect(next[0].attributes.query).toEqual({
			inherit: false,
			perPage: 5,
			order: 'asc',
			orderBy: 'title',
		});
	});

	it('relocates the section when the target variant declares a placement', () => {
		const tree = [
			stamped('core/group', 'area/content', {}, []),
			stamped('core/group', 'section/page-title:banner'),
		];
		const next = swapSection(
			tree,
			{
				sectionId: 'page-title',
				targetVariant: {
					id: 'simple',
					label: 'Simple',
					html: 'title-simple',
					placement: {
						relativeTo: 'content',
						position: 'inside-start',
					},
				},
			},
			ctx
		);

		expect(next).toHaveLength(1);
		expect(getAtPath(next, [0, 0]).attributes.metadata.blockeraOne).toBe(
			'section/page-title:simple'
		);
	});

	it('inserts a missing section at the placement, content area, or root end', () => {
		const placementVariant = {
			...GRID_VARIANT,
			placement: { relativeTo: 'content', position: 'inside-end' },
		};

		const withContent = [stamped('core/group', 'area/content', {}, [])];
		const placed = swapSection(
			withContent,
			{ sectionId: SECTION_ID, targetVariant: placementVariant },
			ctx
		);
		expect(getAtPath(placed, [0, 0]).name).toBe('core/query');

		// No placement → content area inside-end.
		const areaFallback = swapSection(
			[
				stamped('core/group', 'area/content', {}, [
					block('core/paragraph'),
				]),
			],
			{ sectionId: SECTION_ID, targetVariant: GRID_VARIANT },
			ctx
		);
		expect(getAtPath(areaFallback, [0, 1]).name).toBe('core/query');

		// No content area either → appended at the root.
		const rootFallback = swapSection(
			[block('core/paragraph')],
			{ sectionId: SECTION_ID, targetVariant: GRID_VARIANT },
			ctx
		);
		expect(rootFallback[1].name).toBe('core/query');
	});

	it('is a no-op without variant html or when parse yields nothing', () => {
		const tree = [stamped('core/query', `section/${SECTION_ID}:list`)];
		expect(
			swapSection(
				tree,
				{
					sectionId: SECTION_ID,
					targetVariant: { id: 'x', label: 'X' },
				},
				ctx
			)
		).toBe(tree);
		expect(
			swapSection(
				tree,
				{
					sectionId: SECTION_ID,
					targetVariant: { id: 'x', label: 'X', html: 'empty' },
				},
				ctx
			)
		).toBe(tree);
	});
});

describe('toggleSection', () => {
	const DEFAULT_VARIANT = {
		id: 'grid-2',
		label: 'Grid 2',
		html: 'listing-grid',
	};

	it('removes the section when disabling and no-ops when already absent', () => {
		const tree = [
			stamped('core/group', 'area/content', {}, [
				stamped('core/query', `section/${SECTION_ID}:list`),
			]),
		];
		const removed = toggleSection(
			tree,
			{ sectionId: SECTION_ID, enabled: false },
			ctx
		);
		expect(findStamp(removed, SECTION_ID)).toBeNull();

		const empty = [stamped('core/group', 'area/content')];
		expect(
			toggleSection(empty, { sectionId: SECTION_ID, enabled: false }, ctx)
		).toBe(empty);
	});

	it('keeps the tree when enabling an already-present section', () => {
		const tree = [stamped('core/query', `section/${SECTION_ID}:list`)];
		expect(
			toggleSection(
				tree,
				{
					sectionId: SECTION_ID,
					enabled: true,
					defaultVariant: DEFAULT_VARIANT,
				},
				ctx
			)
		).toBe(tree);
	});

	it('inserts the default variant honoring placement > insert rule > content area', () => {
		const base = () => [
			stamped('core/group', 'area/content', {}, [
				block('core/paragraph'),
			]),
		];

		const viaPlacement = toggleSection(
			base(),
			{
				sectionId: SECTION_ID,
				enabled: true,
				defaultVariant: {
					...DEFAULT_VARIANT,
					placement: { relativeTo: 'content', position: 'after' },
				},
			},
			ctx
		);
		expect(viaPlacement[1].name).toBe('core/query');
		expect(viaPlacement[1].attributes.metadata.blockeraOne).toBe(
			`section/${SECTION_ID}:grid-2`
		);

		const viaInsertRule = toggleSection(
			base(),
			{
				sectionId: SECTION_ID,
				enabled: true,
				defaultVariant: DEFAULT_VARIANT,
				insert: { relativeTo: 'content', position: 'before' },
			},
			ctx
		);
		expect(viaInsertRule[0].name).toBe('core/query');

		const viaContentArea = toggleSection(
			base(),
			{
				sectionId: SECTION_ID,
				enabled: true,
				defaultVariant: DEFAULT_VARIANT,
			},
			ctx
		);
		expect(getAtPath(viaContentArea, [0, 0]).name).toBe('core/query');

		const viaRootAppend = toggleSection(
			[block('core/paragraph')],
			{
				sectionId: SECTION_ID,
				enabled: true,
				defaultVariant: DEFAULT_VARIANT,
			},
			ctx
		);
		expect(viaRootAppend[1].name).toBe('core/query');
	});

	it('is a no-op when enabling without usable default markup', () => {
		const tree = [stamped('core/group', 'area/content')];
		expect(
			toggleSection(tree, { sectionId: SECTION_ID, enabled: true }, ctx)
		).toBe(tree);
		expect(
			toggleSection(
				tree,
				{
					sectionId: SECTION_ID,
					enabled: true,
					defaultVariant: { id: 'x', label: 'X', html: 'empty' },
				},
				ctx
			)
		).toBe(tree);
	});
});

describe('setSectionAttribute', () => {
	it('sets a nested attribute, creating intermediate objects immutably', () => {
		const tree = [
			stamped('core/query', `section/${SECTION_ID}:list`, {
				query: { perPage: 10 },
			}),
		];
		const next = setSectionAttribute(tree, {
			sectionId: SECTION_ID,
			attributePath: 'query.perPage',
			value: 24,
		});
		expect(next[0].attributes.query).toEqual({ perPage: 24 });
		expect(tree[0].attributes.query.perPage).toBe(10);

		const created = setSectionAttribute(tree, {
			sectionId: SECTION_ID,
			attributePath: 'style.spacing.blockGap',
			value: '2rem',
		});
		expect(created[0].attributes.style).toEqual({
			spacing: { blockGap: '2rem' },
		});
	});

	it('is a no-op when the section is missing', () => {
		const tree = [block('core/paragraph')];
		expect(
			setSectionAttribute(tree, {
				sectionId: SECTION_ID,
				attributePath: 'query.perPage',
				value: 1,
			})
		).toBe(tree);
	});
});

describe('setSectionBlockStyle', () => {
	it('writes is-style-* and keeps Blockera class names', () => {
		const tree = [
			stamped(
				'core/breadcrumbs',
				'section/page-title-breadcrumbs:default',
				{
					className: 'blockera-block blockera-block-abc',
				}
			),
		];
		const next = setSectionBlockStyle(tree, {
			sectionId: 'page-title-breadcrumbs',
			styleName: 'underline',
		});
		expect(next[0].attributes.className).toBe(
			'blockera-block blockera-block-abc is-style-underline'
		);
		expect(tree[0].attributes.className).toBe(
			'blockera-block blockera-block-abc'
		);
	});

	it('is a no-op when the section is missing', () => {
		const tree = [block('core/paragraph')];
		expect(
			setSectionBlockStyle(tree, {
				sectionId: 'page-title-breadcrumbs',
				styleName: 'default',
			})
		).toBe(tree);
	});
});

const PAGE_TITLE_INNER = {
	title: 'page-title-title',
	description: 'page-title-description',
	breadcrumbs: 'page-title-breadcrumbs',
};

function pageHeader(inner) {
	return [stamped('core/group', 'section/page-title:default', {}, inner)];
}

describe('placeSection', () => {
	it('moves the stamped block to inside-start or inside-end of the parent', () => {
		const tree = pageHeader([
			stamped(
				'core/query-title',
				`section/${PAGE_TITLE_INNER.title}:default`
			),
			stamped(
				'core/term-description',
				`section/${PAGE_TITLE_INNER.description}:default`
			),
			stamped(
				'core/breadcrumbs',
				`section/${PAGE_TITLE_INNER.breadcrumbs}:default`
			),
		]);

		const top = placeSection(tree, {
			sectionId: PAGE_TITLE_INNER.breadcrumbs,
			placement: { relativeTo: 'page-title', position: 'inside-start' },
		});
		expect(getAtPath(top, [0, 0]).name).toBe('core/breadcrumbs');
		expect(getAtPath(top, [0, 2]).name).toBe('core/term-description');

		const bottom = placeSection(top, {
			sectionId: PAGE_TITLE_INNER.breadcrumbs,
			placement: { relativeTo: 'page-title', position: 'inside-end' },
		});
		expect(getAtPath(bottom, [0, 2]).name).toBe('core/breadcrumbs');
	});

	it('is a no-op when the section is missing', () => {
		const tree = pageHeader([]);
		expect(
			placeSection(tree, {
				sectionId: PAGE_TITLE_INNER.breadcrumbs,
				placement: { relativeTo: 'page-title', position: 'inside-end' },
			})
		).toBe(tree);
	});
});

describe('orderInnerSections', () => {
	it('orders managed stamps and keeps unstamped siblings after them', () => {
		const extra = block('core/paragraph', { content: 'note' });
		const tree = pageHeader([
			stamped(
				'core/breadcrumbs',
				`section/${PAGE_TITLE_INNER.breadcrumbs}:default`
			),
			extra,
			stamped(
				'core/term-description',
				`section/${PAGE_TITLE_INNER.description}:default`
			),
			stamped(
				'core/query-title',
				`section/${PAGE_TITLE_INNER.title}:default`
			),
		]);

		const next = orderInnerSections(tree, 'page-title', [
			PAGE_TITLE_INNER.title,
			PAGE_TITLE_INNER.description,
			PAGE_TITLE_INNER.breadcrumbs,
		]);
		const names = getAtPath(next, [0]).innerBlocks.map((b) => b.name);
		expect(names).toEqual([
			'core/query-title',
			'core/term-description',
			'core/breadcrumbs',
			'core/paragraph',
		]);
	});
});

describe('toggleSection inner insert + banner align', () => {
	beforeAll(() => {
		MARKUP['title-block'] = [
			stamped(
				'core/query-title',
				`section/${PAGE_TITLE_INNER.title}:default`
			),
		];
	});

	it('centers inserted blocks when the parent variant is banner', () => {
		const tree = [
			stamped('core/group', 'section/page-title:banner', {}, []),
		];
		const next = toggleSection(
			tree,
			{
				sectionId: PAGE_TITLE_INNER.title,
				enabled: true,
				defaultVariant: {
					id: 'default',
					label: 'Title',
					html: 'title-block',
				},
				insert: { relativeTo: 'page-title', position: 'inside-start' },
			},
			ctx
		);
		expect(getAtPath(next, [0, 0]).attributes.textAlign).toBe('center');
	});
});
