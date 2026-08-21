/**
 * chrome-rail.ts: site header/footer template-part swaps, vertical-rail
 * wrap/unwrap, and the hide-section preparation. Injected parse, internal
 * fixtures only.
 */

import {
	prepareHideChromeSection,
	swapTemplatePart,
	unwrapChromeRail,
} from '../chrome-rail';
import { findChromeRail } from '../resolve/resolve-state';
import { getStamp } from '../metadata';
import { findByStamp } from '../tree';
import { block, stamped } from './helpers/block-fixtures';

const LAYOUT_ID = 'main';

const MARKUP = {
	'header-large': [
		block('core/template-part', {
			slug: 'raw-slug',
			area: 'header',
			tagName: 'header',
		}),
	],
	// Pattern-kind rail variant: full pre-stamped frame with an empty body
	// area (mirrors patterns/archive/builder-header-vertical.php).
	'vertical-header': [
		stamped('core/columns', 'container/chrome-rail:vertical-rail', {}, [
			block('core/column', { width: '8rem' }, [
				stamped(
					'core/template-part',
					'section/header:vertical-header',
					{
						slug: 'vertical-header',
						area: 'header',
						tagName: 'header',
					}
				),
			]),
			stamped('core/column', 'area/rail-body-area', { width: '90%' }),
		]),
	],
	// Child-theme override that lost the rail-body-area stamp.
	'vertical-no-area': [
		stamped('core/columns', 'container/chrome-rail:vertical-rail', {}, [
			block('core/column', { width: '8rem' }, [
				stamped(
					'core/template-part',
					'section/header:vertical-header',
					{
						slug: 'vertical-header',
						area: 'header',
						tagName: 'header',
					}
				),
			]),
			block('core/column', { width: '90%' }),
		]),
	],
	'footer-columns': [
		block('core/template-part', {
			slug: 'raw-slug',
			area: 'footer',
			tagName: 'footer',
		}),
	],
};

const ctx = {
	parse: (html) => JSON.parse(JSON.stringify(MARKUP[html] ?? [])),
	serialize: () => '',
};

function makeHeader(slug = 'header-default') {
	return stamped('core/template-part', `section/header:${slug}`, {
		slug,
		area: 'header',
	});
}

function makeLayout() {
	return stamped(
		'core/group',
		`layout/${LAYOUT_ID}:no-sidebar`,
		{ tagName: 'main' },
		[
			stamped('core/group', 'area/content', {}, [
				block('core/paragraph', { content: 'body' }),
			]),
		]
	);
}

function makeFooter(slug = 'footer-default') {
	return stamped('core/template-part', `section/footer:${slug}`, {
		slug,
		area: 'footer',
	});
}

function makeFlatTree() {
	return [makeHeader(), makeLayout(), makeFooter()];
}

/** Rail tree as produced by wrapVerticalRail: [rail(header|area(layout)), footer]. */
function makeRailTree() {
	return [
		stamped('core/columns', 'container/chrome-rail:vertical-rail', {}, [
			block('core/column', { width: '8rem' }, [
				stamped(
					'core/template-part',
					'section/header:vertical-header',
					{
						slug: 'vertical-header',
						area: 'header',
					}
				),
			]),
			stamped('core/column', 'area/rail-body-area', { width: '90%' }, [
				makeLayout(),
			]),
		]),
		makeFooter(),
	];
}

/** Pre-pattern hardcoded rail: no area stamp, no header stamp (positional only). */
function makeLegacyRailTree() {
	return [
		stamped('core/columns', 'container/chrome-rail:vertical-rail', {}, [
			block('core/column', { width: '8rem' }, [
				block('core/template-part', {
					slug: 'vertical-header',
					area: 'header',
				}),
			]),
			block('core/column', { width: '90%' }, [
				block('core/group', { tagName: 'main' }, [
					block('core/paragraph', { content: 'legacy-body' }),
				]),
			]),
		]),
		makeFooter(),
	];
}

function swapHeader(blocks, variant) {
	return swapTemplatePart(
		blocks,
		{ sectionId: 'header', targetVariant: variant, layoutId: LAYOUT_ID },
		ctx
	);
}

describe('unwrapChromeRail', () => {
	it('flattens the rail back to [header, layout, siblings]', () => {
		const { blocks, header } = unwrapChromeRail(makeRailTree(), LAYOUT_ID);

		expect(blocks.map((b) => getStamp(b)?.id)).toEqual([
			'header',
			LAYOUT_ID,
			'footer',
		]);
		expect(header.attributes.slug).toBe('vertical-header');
		// Layout content survives the unwrap.
		const content = findByStamp(blocks, (s) => s?.id === 'content');
		expect(content.block.innerBlocks[0].attributes.content).toBe('body');
	});

	it('falls back to positional columns for pre-pattern rails without inner stamps', () => {
		const { blocks, header } = unwrapChromeRail(
			makeLegacyRailTree(),
			LAYOUT_ID
		);

		expect(header.attributes.slug).toBe('vertical-header');
		expect(blocks).toHaveLength(3);
		// Body column content is treated as the layout even unstamped.
		expect(blocks[1].attributes.tagName).toBe('main');
		expect(blocks[1].innerBlocks[0].attributes.content).toBe('legacy-body');
		expect(getStamp(blocks[2]).id).toBe('footer');
	});

	it('passes a flat tree through and still reports the header', () => {
		const flat = makeFlatTree();
		const { blocks, header } = unwrapChromeRail(flat, LAYOUT_ID);

		expect(blocks).toBe(flat);
		expect(header.attributes.slug).toBe('header-default');
		// The reported header is a detached clone.
		expect(header).not.toBe(flat[0]);
	});

	it('returns a null header when none exists', () => {
		const { header } = unwrapChromeRail([makeLayout()], LAYOUT_ID);
		expect(header).toBeNull();
	});
});

describe('swapTemplatePart (stacked)', () => {
	const LARGE = { id: 'header-large', label: 'Large', html: 'header-large' };

	it('replaces the header in place, forcing slug + stamp to the variant', () => {
		const next = swapHeader(makeFlatTree(), LARGE);

		expect(next).toHaveLength(3);
		expect(next[0].attributes.slug).toBe('header-large');
		expect(getStamp(next[0])).toEqual({
			role: 'section',
			id: 'header',
			variant: 'header-large',
		});
	});

	it('unwraps an existing vertical rail before a stacked header swap', () => {
		const next = swapHeader(makeRailTree(), LARGE);

		expect(findChromeRail(next)).toBeNull();
		expect(next.map((b) => getStamp(b)?.id)).toEqual([
			'header',
			LAYOUT_ID,
			'footer',
		]);
		expect(next[0].attributes.slug).toBe('header-large');
	});

	it('inserts a missing part at its placement, else relative to the layout', () => {
		const FOOTER = {
			id: 'footer-columns',
			label: 'Columns',
			html: 'footer-columns',
		};

		// Placement wins when the section is missing.
		const viaPlacement = swapTemplatePart(
			[makeLayout()],
			{
				sectionId: 'footer',
				targetVariant: {
					...FOOTER,
					placement: { relativeTo: LAYOUT_ID, position: 'after' },
				},
				layoutId: LAYOUT_ID,
			},
			ctx
		);
		expect(getStamp(viaPlacement[1])).toEqual({
			role: 'section',
			id: 'footer',
			variant: 'footer-columns',
		});

		// Fallback: header before layout, footer after layout.
		const headerFallback = swapHeader([makeLayout()], LARGE);
		expect(getStamp(headerFallback[0]).id).toBe('header');
		expect(getStamp(headerFallback[1]).id).toBe(LAYOUT_ID);

		const footerFallback = swapTemplatePart(
			[makeLayout()],
			{ sectionId: 'footer', targetVariant: FOOTER, layoutId: LAYOUT_ID },
			ctx
		);
		expect(getStamp(footerFallback[1]).id).toBe('footer');

		// No layout at all: header prepends, footer appends.
		const loose = [block('core/paragraph')];
		expect(getStamp(swapHeader(loose, LARGE)[0]).id).toBe('header');
		const looseFooter = swapTemplatePart(
			loose,
			{ sectionId: 'footer', targetVariant: FOOTER, layoutId: LAYOUT_ID },
			ctx
		);
		expect(getStamp(looseFooter[1]).id).toBe('footer');
	});

	it('is a no-op without variant html', () => {
		const tree = makeFlatTree();
		expect(swapHeader(tree, { id: 'header-large', label: 'Large' })).toBe(
			tree
		);
	});
});

describe('swapTemplatePart (vertical rail)', () => {
	const VERTICAL = {
		id: 'vertical-header',
		label: 'Vertical',
		html: 'vertical-header',
		chromeLayout: 'vertical-rail',
	};

	it('injects the layout into the pattern rail area, leaving the footer outside', () => {
		const next = swapHeader(makeFlatTree(), VERTICAL);

		expect(next).toHaveLength(2);
		const rail = next[0];
		expect(getStamp(rail)).toEqual({
			role: 'container',
			id: 'chrome-rail',
			variant: 'vertical-rail',
		});
		expect(rail.name).toBe('core/columns');

		// Header ships pre-stamped inside the pattern frame.
		const headerPart = rail.innerBlocks[0].innerBlocks[0];
		expect(headerPart.attributes.slug).toBe('vertical-header');
		expect(getStamp(headerPart)).toEqual({
			role: 'section',
			id: 'header',
			variant: 'vertical-header',
		});

		// Layout lands inside the stamped body area.
		const areaColumn = rail.innerBlocks[1];
		expect(getStamp(areaColumn).id).toBe('rail-body-area');
		expect(getStamp(areaColumn.innerBlocks[0]).id).toBe(LAYOUT_ID);
		expect(getStamp(next[1]).id).toBe('footer');
	});

	it('rebuilds the rail idempotently when already in vertical layout', () => {
		const next = swapHeader(makeRailTree(), VERTICAL);

		expect(
			next.filter((b) => getStamp(b)?.id === 'chrome-rail')
		).toHaveLength(1);
		const rail = next[0];
		expect(rail.innerBlocks[0].innerBlocks[0].attributes.slug).toBe(
			'vertical-header'
		);
		// Content still lives inside the rail's body area.
		const content = findByStamp([rail], (s) => s?.id === 'content');
		expect(content.block.innerBlocks[0].attributes.content).toBe('body');
	});

	it('falls back to the last column when the pattern lost the area stamp', () => {
		const next = swapHeader(makeFlatTree(), {
			...VERTICAL,
			html: 'vertical-no-area',
		});

		const rail = next[0];
		expect(getStamp(rail).id).toBe('chrome-rail');
		const lastColumn = rail.innerBlocks[rail.innerBlocks.length - 1];
		expect(getStamp(lastColumn.innerBlocks[0]).id).toBe(LAYOUT_ID);
	});
});

describe('prepareHideChromeSection', () => {
	it('unwraps the rail before hiding the header', () => {
		const prepared = prepareHideChromeSection(
			makeRailTree(),
			'header',
			LAYOUT_ID
		);
		expect(findChromeRail(prepared)).toBeNull();
		expect(prepared.map((b) => getStamp(b)?.id)).toEqual([
			'header',
			LAYOUT_ID,
			'footer',
		]);
	});

	it('passes through for non-header sections and flat trees', () => {
		const rail = makeRailTree();
		expect(prepareHideChromeSection(rail, 'footer', LAYOUT_ID)).toBe(rail);

		const flat = makeFlatTree();
		expect(prepareHideChromeSection(flat, 'header', LAYOUT_ID)).toBe(flat);
	});
});
