/**
 * transplantLayout: area content round-trips, sibling-section carry,
 * container attribute carry-over, and fallback insertion. Parse/serialize are
 * injected so this runs without WP; fixtures are internal BlockNode trees.
 */

import { getStamp } from '../metadata';
import { transplantLayout } from '../operations';
import { findByStamp, getAtPath } from '../tree';

const userParagraph = {
	name: 'core/paragraph',
	attributes: { content: 'USER-CUSTOM-CONTENT', className: 'keep-me' },
	innerBlocks: [],
};

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

const noSidebar = stamped(
	'core/group',
	'layout/archive-body:no-sidebar',
	{ tagName: 'main', className: 'user-styled-main' },
	[stamped('core/group', 'area/content', {}, [userParagraph])]
);

function makeSidebarLayout(variant, columnOrder) {
	const contentColumn = stamped(
		'core/column',
		'container/content-column',
		{ width: '66.66%' },
		[stamped('core/group', 'area/content')]
	);
	const sidebarColumn = stamped(
		'core/column',
		'container/sidebar-column',
		{ width: '33.33%' },
		[
			stamped('core/group', 'area/sidebar-area', {}, [
				stamped('core/template-part', 'section/sidebar', {
					slug: 'sidebar',
				}),
			]),
		]
	);
	return stamped(
		'core/group',
		`layout/archive-body:${variant}`,
		{ tagName: 'main' },
		[
			stamped(
				'core/columns',
				'container/layout-columns',
				{},
				columnOrder === 'sidebar-first'
					? [sidebarColumn, contentColumn]
					: [contentColumn, sidebarColumn]
			),
		]
	);
}

const VARIANTS = {
	'no-sidebar': {
		id: 'no-sidebar',
		label: 'No sidebar',
		html: 'no-sidebar',
		areas: ['content'],
	},
	'sidebar-left': {
		id: 'sidebar-left',
		label: 'Sidebar left',
		html: 'sidebar-left',
		areas: ['content', 'sidebar-area'],
	},
	'sidebar-right': {
		id: 'sidebar-right',
		label: 'Sidebar right',
		html: 'sidebar-right',
		areas: ['content', 'sidebar-area'],
	},
};

const TREES = {
	'no-sidebar': [noSidebar],
	'sidebar-left': [makeSidebarLayout('sidebar-left', 'sidebar-first')],
	'sidebar-right': [makeSidebarLayout('sidebar-right', 'content-first')],
};

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function makeStart() {
	return [
		block('core/template-part', { slug: 'header' }),
		clone(noSidebar),
		block('core/template-part', { slug: 'footer' }),
	];
}

const ctx = {
	parse: (html) => clone(TREES[html] || []),
	serialize: () => '',
};

function transplant(blocks, variantId, extraParams = {}) {
	return transplantLayout(
		blocks,
		{
			layoutId: 'archive-body',
			targetVariant: VARIANTS[variantId],
			knownVariants: Object.values(VARIANTS),
			...extraParams,
		},
		ctx
	);
}

function findStamp(blocks, id) {
	return findByStamp(blocks, (stamp) => stamp?.id === id);
}

describe('transplantLayout round-trip', () => {
	it('preserves user content and attributes across A→B→A', () => {
		const afterLeft = transplant(makeStart(), 'sidebar-left');
		const contentAfter = findStamp(afterLeft, 'content');

		expect(contentAfter).not.toBeNull();
		expect(contentAfter.block.innerBlocks[0].attributes.content).toBe(
			'USER-CUSTOM-CONTENT'
		);

		const sidebarAreaAfter = findStamp(afterLeft, 'sidebar-area');
		expect(sidebarAreaAfter).not.toBeNull();
		expect(sidebarAreaAfter.block.innerBlocks[0].name).toBe(
			'core/template-part'
		);

		const afterBack = transplant(afterLeft, 'no-sidebar');
		const contentBack = findStamp(afterBack, 'content');

		expect(contentBack).not.toBeNull();
		expect(contentBack.block.innerBlocks[0].attributes.content).toBe(
			'USER-CUSTOM-CONTENT'
		);
		expect(contentBack.block.innerBlocks[0].attributes.className).toBe(
			'keep-me'
		);
	});

	it('re-stamps the layout root with the target variant id', () => {
		const afterLeft = transplant(makeStart(), 'sidebar-left');
		const layout = findStamp(afterLeft, 'archive-body');
		expect(getStamp(layout.block)).toEqual({
			role: 'layout',
			id: 'archive-body',
			variant: 'sidebar-left',
		});
		// Header/footer siblings stay in place around the layout.
		expect(afterLeft[0].attributes.slug).toBe('header');
		expect(afterLeft[2].attributes.slug).toBe('footer');
	});
});

describe('area handling', () => {
	it('discards content of areas the target variant does not expose', () => {
		const start = [
			block('core/template-part', { slug: 'header' }),
			clone(TREES['sidebar-left'][0]),
		];
		// Customize the sidebar area, then move to a layout without it.
		const area = findStamp(start, 'sidebar-area');
		area.block.innerBlocks.push(
			block('core/paragraph', { content: 'SIDEBAR-WIDGET' })
		);

		const next = transplant(start, 'no-sidebar');
		expect(findStamp(next, 'sidebar-area')).toBeNull();
		expect(
			findByStamp(
				next,
				(_s, b) => b.attributes?.content === 'SIDEBAR-WIDGET'
			)
		).toBeNull();
	});
});

describe('container attribute carry-over', () => {
	it('carries user styling on containers while target layout attrs win', () => {
		const start = [clone(TREES['sidebar-left'][0])];
		// User styles the columns container + the content column.
		const columns = findStamp(start, 'layout-columns');
		columns.block.attributes.align = 'wide';
		columns.block.attributes.style = { spacing: { blockGap: '3rem' } };
		const contentColumn = findStamp(start, 'content-column');
		contentColumn.block.attributes.className = 'user-column';

		const next = transplant(start, 'sidebar-right');

		const nextColumns = findStamp(next, 'layout-columns');
		expect(nextColumns.block.attributes.align).toBe('wide');
		expect(nextColumns.block.attributes.style).toEqual({
			spacing: { blockGap: '3rem' },
		});

		const nextContentColumn = findStamp(next, 'content-column');
		expect(nextContentColumn.block.attributes.className).toBe(
			'user-column'
		);
		// Layout attrs (not user styling) come from the target variant.
		expect(nextContentColumn.block.attributes.width).toBe('66.66%');

		// Column order actually flipped to the target layout's shape.
		const columnsChildren = nextColumns.block.innerBlocks.map(
			(b) => getStamp(b)?.id
		);
		expect(columnsChildren).toEqual(['content-column', 'sidebar-column']);
	});

	it('carries the layout-root ("main") styling across transplants', () => {
		const afterLeft = transplant(makeStart(), 'sidebar-left');
		const layout = findStamp(afterLeft, 'archive-body');
		expect(layout.block.attributes.className).toBe('user-styled-main');
	});
});

describe('sibling sections', () => {
	function makeStartWithPageTitle() {
		const layout = clone(noSidebar);
		// Full-width section sits at the layout root, outside the content area.
		layout.innerBlocks.unshift(
			stamped('core/group', 'section/page-title:banner', {
				className: 'band',
			})
		);
		return [block('core/template-part', { slug: 'header' }), layout];
	}

	it('re-attaches carried sections at the layout body start by default', () => {
		const next = transplant(makeStartWithPageTitle(), 'sidebar-left', {
			siblingSectionIds: ['page-title'],
		});

		const layout = findStamp(next, 'archive-body');
		expect(getStamp(layout.block.innerBlocks[0])).toEqual({
			role: 'section',
			id: 'page-title',
			variant: 'banner',
		});
		expect(layout.block.innerBlocks[0].attributes.className).toBe('band');
	});

	it('honors the active design placement for carried sections', () => {
		const next = transplant(makeStartWithPageTitle(), 'sidebar-left', {
			siblingSectionIds: ['page-title'],
			sectionPlacements: {
				'page-title': {
					relativeTo: 'content',
					position: 'inside-start',
				},
			},
		});

		const content = findStamp(next, 'content');
		expect(getStamp(content.block.innerBlocks[0]).id).toBe('page-title');
		// The user paragraph follows the re-attached section.
		expect(content.block.innerBlocks[1].attributes.content).toBe(
			'USER-CUSTOM-CONTENT'
		);
	});

	it('peels sibling sections out of legacy content to avoid duplication', () => {
		// Legacy templates nested the page-title inside the content area.
		const layout = clone(noSidebar);
		const content = layout.innerBlocks[0];
		content.innerBlocks.unshift(
			stamped('core/group', 'section/page-title:banner')
		);

		const next = transplant([layout], 'sidebar-left', {
			siblingSectionIds: ['page-title'],
		});

		let matches = 0;
		const seen = [];
		// Count every page-title occurrence in the whole result.
		const walk = (nodes) => {
			for (const node of nodes) {
				if (getStamp(node)?.id === 'page-title') {
					matches++;
					seen.push(node);
				}
				walk(node.innerBlocks || []);
			}
		};
		walk(next);

		expect(matches).toBe(1);
		expect(
			getAtPath(next, findStamp(next, 'content').path).innerBlocks
		).toHaveLength(1); // only the user paragraph remains in content
	});
});

describe('unrecognized / fallback flows', () => {
	it('rebuilds an unstamped main, keeping its children as content (best effort)', () => {
		const raw = [
			block('core/group', { tagName: 'main', className: 'legacy' }, [
				block('core/paragraph', { content: 'LEGACY-BODY' }),
			]),
		];
		const next = transplant(raw, 'sidebar-left');

		const content = findStamp(next, 'content');
		expect(content.block.innerBlocks[0].attributes.content).toBe(
			'LEGACY-BODY'
		);
		// User styling on the legacy main carries onto the new layout root.
		const layout = findStamp(next, 'archive-body');
		expect(layout.block.attributes.className).toBe('legacy');
		expect(getStamp(layout.block).variant).toBe('sidebar-left');
	});

	it('inserts after the header when no layout exists at all', () => {
		const next = transplant(
			[
				block('core/template-part', { slug: 'header' }),
				block('core/template-part', { slug: 'footer' }),
			],
			'no-sidebar'
		);

		expect(next.map((b) => b.attributes.slug || getStamp(b)?.id)).toEqual([
			'header',
			'archive-body',
			'footer',
		]);
	});

	it('prepends the layout when there is no header anchor either', () => {
		const next = transplant([block('core/paragraph')], 'no-sidebar');
		expect(getStamp(next[0])?.id).toBe('archive-body');
		expect(next[1].name).toBe('core/paragraph');
	});

	it('is a no-op without variant html or when parse yields nothing', () => {
		const tree = makeStart();
		expect(
			transplantLayout(
				tree,
				{
					layoutId: 'archive-body',
					targetVariant: { id: 'x', label: 'X' },
				},
				ctx
			)
		).toBe(tree);
		expect(
			transplantLayout(
				tree,
				{
					layoutId: 'archive-body',
					targetVariant: { id: 'x', label: 'X', html: 'unknown-key' },
				},
				ctx
			)
		).toBe(tree);
	});
});
