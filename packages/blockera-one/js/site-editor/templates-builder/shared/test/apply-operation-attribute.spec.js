/**
 * applyOperation setSectionAttribute / setBlockStyle / placeSection.
 * The WP parse/serialize adapter is mocked with an internal markup map
 * so no @wordpress/blocks registration is needed.
 */

jest.mock('../blocks-adapter', () => {
	const markup = {};
	return {
		defaultOpsContext: {
			parse: (html) => JSON.parse(JSON.stringify(markup[html] ?? [])),
			serialize: () => '',
		},
		__setMarkup: (key, tree) => {
			markup[key] = tree;
		},
	};
});

import {
	apply,
	CONTROLS,
	LAYOUT_ID,
	makeBlocks,
	paginationTree,
} from './helpers/apply-operation-setup';
import { getStamp } from '../metadata';
import { findStamp, stamped } from './helpers/block-fixtures';

describe('setSectionAttribute', () => {
	it('sets the nested attribute on the detected section', () => {
		const result = apply(CONTROLS.queryPerPage, 24);
		const listing = findStamp(result.blocks, 'posts-listing');
		expect(listing.block.attributes.query.perPage).toBe(24);
	});

	it('attaches attributeUpdates when the listing has a clientId', () => {
		const blocks = makeBlocks();
		findStamp(blocks, 'posts-listing').block.clientId = 'listing-live';
		const result = apply(CONTROLS.queryPerPage, 24, { blocks });
		expect(result.localReplace.attributeUpdates).toEqual([
			{
				clientId: 'listing-live',
				attributes: findStamp(result.blocks, 'posts-listing').block
					.attributes,
			},
		]);
	});

	it('writes object values onto the nested attribute path', () => {
		const gapValue = {
			lock: true,
			gap: '24px',
			columns: '',
			rows: '',
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}),
		];
		const control = {
			id: 'page-header-gap',
			type: 'input',
			label: 'Items Spacing',
			target: { kind: 'section', id: 'page-header' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes.blockeraGap
				.value
		).toEqual(gapValue);
	});

	it('also writes the same attribute onto alsoSetOn stamps', () => {
		const gapValue = {
			lock: true,
			gap: '24px',
			columns: '',
			rows: '',
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped('core/group', 'container/body', {}),
			]),
		];
		const control = {
			id: 'page-header-gap',
			type: 'input',
			label: 'Items Spacing',
			target: { kind: 'section', id: 'page-header' },
			alsoSetOn: ['body'],
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes.blockeraGap
				.value
		).toEqual(gapValue);
		expect(
			findStamp(result.blocks, 'body').block.attributes.blockeraGap.value
		).toEqual(gapValue);
	});

	it('skips a missing alsoSetOn stamp without changing the primary write', () => {
		const gapValue = {
			lock: true,
			gap: '24px',
			columns: '',
			rows: '',
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}),
		];
		const control = {
			id: 'page-header-gap',
			type: 'input',
			label: 'Items Spacing',
			target: { kind: 'section', id: 'page-header' },
			alsoSetOn: ['body'],
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes.blockeraGap
				.value
		).toEqual(gapValue);
		expect(findStamp(result.blocks, 'body')).toBeNull();
	});

	it('merges spacing sides into the current object without wiping siblings', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {
				blockeraSpacing: {
					value: {
						padding: {
							top: '60px',
							right: '50px',
							bottom: '60px',
							left: '50px',
						},
						margin: {
							top: '',
							right: '',
							bottom: '40px',
							left: '',
						},
					},
				},
			}),
		];
		const control = {
			id: 'page-header-padding',
			type: 'input',
			label: 'Container Padding',
			target: { kind: 'section', id: 'page-header' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraSpacing.value',
			attributeMergeKeys: ['padding.top', 'padding.bottom'],
		};
		const result = apply(control, '80px', { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraSpacing.value
		).toEqual({
			padding: {
				top: '80px',
				right: '50px',
				bottom: '80px',
				left: '50px',
			},
			margin: {
				top: '',
				right: '',
				bottom: '40px',
				left: '',
			},
		});
	});

	it('writes featured image Blockera ratio, radius, resolution, and link attrs', () => {
		const blocks = [
			stamped(
				'core/post-featured-image',
				'section/post-featured-image:default',
				{ isLink: true, aspectRatio: '3/2' }
			),
		];
		const target = { kind: 'section', id: 'post-featured-image' };
		const ratio = apply(
			{
				id: 'post-featured-image-aspect-ratio',
				type: 'aspect-ratio',
				label: 'Aspect Ratio',
				target,
				operation: 'setSectionAttribute',
				attributePath: 'blockeraRatio.value',
			},
			{ val: '16/9', width: '', height: '' },
			{ blocks }
		);
		expect(
			findStamp(ratio.blocks, 'post-featured-image').block.attributes
				.blockeraRatio.value
		).toEqual({ val: '16/9', width: '', height: '' });

		const radius = apply(
			{
				id: 'post-featured-image-border-radius',
				type: 'border-radius',
				label: 'Border Radius',
				target,
				operation: 'setSectionAttribute',
				attributePath: 'blockeraBorderRadius.value',
			},
			{ type: 'all', all: '12px' },
			{ blocks: ratio.blocks }
		);
		expect(
			findStamp(radius.blocks, 'post-featured-image').block.attributes
				.blockeraBorderRadius.value
		).toEqual({ type: 'all', all: '12px' });

		const resolution = apply(
			{
				id: 'post-featured-image-resolution',
				type: 'resolution',
				label: 'Resolution',
				target,
				operation: 'setSectionAttribute',
				attributePath: 'sizeSlug',
				defaultValue: 'full',
			},
			'large',
			{ blocks: radius.blocks }
		);
		expect(
			findStamp(resolution.blocks, 'post-featured-image').block.attributes
				.sizeSlug
		).toBe('large');

		const unlinked = apply(
			{
				id: 'post-featured-image-is-link',
				type: 'toggle',
				label: 'Make image a link',
				target,
				operation: 'setSectionAttribute',
				attributePath: 'isLink',
				defaultValue: true,
			},
			false,
			{ blocks: resolution.blocks }
		);
		expect(
			findStamp(unlinked.blocks, 'post-featured-image').block.attributes
				.isLink
		).toBe(false);

		const newTab = apply(
			{
				id: 'post-featured-image-open-in-new-tab',
				type: 'toggle',
				label: 'Open in new tab',
				target,
				operation: 'setSectionAttribute',
				attributePath: 'linkTarget',
				onValue: '_blank',
				offValue: '_self',
				defaultValue: false,
			},
			true,
			{ blocks }
		);
		expect(
			findStamp(newTab.blocks, 'post-featured-image').block.attributes
				.linkTarget
		).toBe('_blank');
		const sameTab = apply(
			{
				id: 'post-featured-image-open-in-new-tab',
				type: 'toggle',
				label: 'Open in new tab',
				target,
				operation: 'setSectionAttribute',
				attributePath: 'linkTarget',
				onValue: '_blank',
				offValue: '_self',
				defaultValue: false,
			},
			false,
			{ blocks: newTab.blocks }
		);
		expect(
			findStamp(sameTab.blocks, 'post-featured-image').block.attributes
				.linkTarget
		).toBe('_self');
	});

	it('writes featured image bottom spacing without wiping other margin sides', () => {
		const blocks = [
			stamped(
				'core/post-featured-image',
				'section/post-featured-image:default',
				{
					blockeraSpacing: {
						value: {
							margin: {
								top: '8px',
								right: '',
								bottom: '',
								left: '4px',
							},
							padding: {
								top: '2px',
								right: '',
								bottom: '',
								left: '',
							},
						},
					},
				}
			),
		];
		const result = apply(
			{
				id: 'post-featured-image-bottom-spacing',
				type: 'input',
				label: 'Bottom Spacing',
				target: { kind: 'section', id: 'post-featured-image' },
				operation: 'setSectionAttribute',
				attributePath: 'blockeraSpacing.value',
				attributeMergeKeys: ['margin.bottom'],
			},
			'24px',
			{ blocks }
		);
		expect(
			findStamp(result.blocks, 'post-featured-image').block.attributes
				.blockeraSpacing.value
		).toEqual({
			margin: {
				top: '8px',
				right: '',
				bottom: '24px',
				left: '4px',
			},
			padding: {
				top: '2px',
				right: '',
				bottom: '',
				left: '',
			},
		});
	});

	it('writes flex layout onto alsoSetOn stamps', () => {
		const layout = {
			direction: 'column',
			alignItems: 'center',
			justifyContent: 'flex-end',
		};
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped('core/group', 'container/body', {}),
			]),
		];
		const control = {
			id: 'page-header-align',
			type: 'layout-matrix',
			label: 'Items alignment',
			target: { kind: 'section', id: 'page-header' },
			alsoSetOn: ['body'],
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFlexLayout.value',
		};
		const result = apply(control, layout, { blocks });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraFlexLayout.value
		).toEqual(layout);
		expect(
			findStamp(result.blocks, 'body').block.attributes.blockeraFlexLayout
				.value
		).toEqual(layout);
	});

	it('attaches attributeUpdates for page-header and alsoSetOn body', () => {
		const layout = {
			direction: 'column',
			alignItems: 'center',
			justifyContent: 'flex-end',
		};
		const blocks = [
			stamped(
				'core/group',
				'section/page-header:simple',
				{ clientId: 'ph-live' },
				[
					stamped('core/group', 'container/body', {
						clientId: 'body-live',
					}),
				]
			),
		];
		const control = {
			id: 'page-header-align',
			type: 'layout-matrix',
			label: 'Items alignment',
			target: { kind: 'section', id: 'page-header' },
			alsoSetOn: ['body'],
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFlexLayout.value',
		};
		const result = apply(control, layout, { blocks });
		expect(
			result.localReplace.attributeUpdates.map((item) => item.clientId)
		).toEqual(['ph-live', 'body-live']);
	});

	it('writes banner items alignment only onto the body container', () => {
		const layout = {
			direction: 'column',
			alignItems: 'flex-end',
			justifyContent: 'center',
		};
		const sectionLayout = {
			direction: 'column',
			alignItems: 'center',
			justifyContent: 'center',
		};
		const blocks = [
			stamped(
				'core/group',
				'section/page-header:banner',
				{ blockeraFlexLayout: { value: sectionLayout } },
				[stamped('core/group', 'container/body', {})]
			),
		];
		const control = {
			id: 'page-header-align-banner',
			type: 'layout-matrix',
			label: 'Items alignment',
			target: { kind: 'container', id: 'body' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFlexLayout.value',
		};
		const result = apply(control, layout, { blocks });
		expect(
			findStamp(result.blocks, 'body').block.attributes.blockeraFlexLayout
				.value
		).toEqual(layout);
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraFlexLayout.value
		).toEqual(sectionLayout);
	});

	it('also writes a fixed attribute on the same target', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {}, [
				stamped('core/group', 'container/body', {
					blockeraWidth: { value: '100%' },
				}),
			]),
		];
		const control = {
			id: 'page-header-body-width',
			type: 'input',
			label: 'Elements Container Width',
			target: { kind: 'container', id: 'body' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraMaxWidth.value',
			alsoWrite: [
				{
					attributePath: 'blockeraWidth.value',
					value: 'stretch',
				},
			],
		};
		const result = apply(control, '720px', { blocks });
		const attrs = findStamp(result.blocks, 'body').block.attributes;
		expect(attrs.blockeraMaxWidth.value).toBe('720px');
		expect(attrs.blockeraWidth.value).toBe('stretch');
	});

	it('persists blockera-block className for style-engine selectors', () => {
		const gapValue = {
			lock: true,
			gap: '24px',
			columns: '',
			rows: '',
		};
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default',
				{ className: 'is-style-underline' }
			),
		];
		const control = {
			id: 'breadcrumbs-gap',
			type: 'input',
			label: 'Gap',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraGap.value',
		};
		const result = apply(control, gapValue, { blocks });
		const attrs = findStamp(result.blocks, 'page-header-breadcrumbs').block
			.attributes;
		expect(attrs.blockeraGap.value).toEqual(gapValue);
		expect(attrs.blockeraPropsId).toBeTruthy();
		expect(attrs.blockeraCompatId).toBeTruthy();
		expect(attrs.className).toContain('is-style-underline');
		expect(attrs.className).toContain('blockera-block');
		expect(attrs.className).toContain(
			`blockera-block-${attrs.blockeraCompatId}`
		);
	});

	it('writes Blockera color and font-size values through the inspector path', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		];
		const color = {
			id: 'breadcrumbs-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const fontSize = {
			id: 'breadcrumbs-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};

		const withColor = apply(color, '#111111', { blocks });
		const colorAttrs = findStamp(
			withColor.blocks,
			'page-header-breadcrumbs'
		).block.attributes;
		expect(colorAttrs.blockeraFontColor).toEqual({ value: '#111111' });
		expect(colorAttrs.className).toContain('blockera-block');

		const withSize = apply(fontSize, '18px', { blocks: withColor.blocks });
		expect(
			findStamp(withSize.blocks, 'page-header-breadcrumbs').block
				.attributes.blockeraFontSize
		).toEqual({ value: '18px' });

		const cleared = apply(color, '', { blocks: withSize.blocks });
		expect(
			findStamp(cleared.blocks, 'page-header-breadcrumbs').block
				.attributes.blockeraFontColor
		).toEqual({ value: '' });
	});

	it('writes color variable objects onto the Blockera attribute', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		];
		const bg = {
			id: 'breadcrumbs-bg-color',
			type: 'color',
			label: 'BG Color',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraBackgroundColor.value',
		};
		const variable = {
			name: 'primary',
			id: 'primary',
			value: '#00ba88',
			type: 'variable',
			var: '--wp--preset--color--primary',
		};
		const result = apply(bg, variable, { blocks });
		expect(
			findStamp(result.blocks, 'page-header-breadcrumbs').block.attributes
				.blockeraBackgroundColor
		).toEqual({ value: variable });
	});

	it('returns null when the control lacks an attributePath', () => {
		const control = { ...CONTROLS.queryPerPage, attributePath: undefined };
		expect(apply(control, 24)).toBeNull();
	});

	it('sets native breadcrumbs attributes (separator and visibility toggles)', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		];
		const separator = {
			id: 'breadcrumbs-separator',
			type: 'input',
			label: 'Separator',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'separator',
			defaultValue: '/',
		};
		const showHome = {
			id: 'breadcrumbs-show-home',
			type: 'toggle',
			label: 'Show home breadcrumb',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'showHomeItem',
			defaultValue: true,
		};

		const withSep = apply(separator, '>', { blocks });
		expect(
			findStamp(withSep.blocks, 'page-header-breadcrumbs').block
				.attributes.separator
		).toBe('>');

		const cleared = apply(separator, '', { blocks: withSep.blocks });
		expect(
			findStamp(cleared.blocks, 'page-header-breadcrumbs').block
				.attributes.separator
		).toBe('');

		const hiddenHome = apply(showHome, false, { blocks: withSep.blocks });
		expect(
			findStamp(hiddenHome.blocks, 'page-header-breadcrumbs').block
				.attributes.showHomeItem
		).toBe(false);
	});
});

describe('setBlockStyle', () => {
	it('swaps is-style-* and preserves other class names', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default',
				{ className: 'blockera-block blockera-block-z3' }
			),
		];
		const control = {
			id: 'breadcrumbs-style',
			type: 'select',
			label: 'Style variation',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const result = apply(control, 'underline', { blocks });
		expect(
			findStamp(result.blocks, 'page-header-breadcrumbs').block.attributes
				.className
		).toBe('blockera-block blockera-block-z3 is-style-underline');
	});

	it('attaches attributeUpdates when the styled block has a clientId', () => {
		const blocks = [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default',
				{
					clientId: 'crumbs-live',
					className: 'blockera-block blockera-block-z3',
				}
			),
		];
		const control = {
			id: 'breadcrumbs-style',
			type: 'select',
			label: 'Style variation',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const result = apply(control, 'underline', { blocks });
		expect(result.localReplace.attributeUpdates[0].clientId).toBe(
			'crumbs-live'
		);
		expect(
			result.localReplace.attributeUpdates[0].attributes.className
		).toBe('blockera-block blockera-block-z3 is-style-underline');
	});
});
describe('placeSection', () => {
	it('moves the inner section using the variant placement', () => {
		const breadcrumb = stamped(
			'core/breadcrumbs',
			'section/page-header-breadcrumbs:default'
		);
		const title = stamped(
			'core/query-title',
			'section/page-header-title:default'
		);
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				title,
				breadcrumb,
			]),
		];
		const control = {
			id: 'breadcrumbs-position',
			type: 'select',
			label: 'Position',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'placeSection',
			defaultValue: 'bottom',
			innerOrder: {
				parentId: 'page-header',
				ids: ['page-header-title', 'page-header-breadcrumbs'],
				leadId: 'page-header-breadcrumbs',
			},
			variants: [
				{
					id: 'top',
					label: 'Top',
					placement: {
						relativeTo: 'page-header',
						position: 'inside-start',
					},
				},
				{
					id: 'bottom',
					label: 'Bottom',
					placement: {
						relativeTo: 'page-header',
						position: 'inside-end',
					},
				},
			],
		};

		const top = apply(control, 'top', { blocks });
		expect(top.blocks[0].innerBlocks[0].name).toBe('core/breadcrumbs');
		expect(top.blocks[0].innerBlocks[1].name).toBe('core/query-title');

		const bottom = apply(control, 'bottom', { blocks: top.blocks });
		expect(bottom.blocks[0].innerBlocks[1].name).toBe('core/breadcrumbs');
	});
});
describe('mirrorMergeWhen', () => {
	const divider = {
		id: 'pagination-top-divider',
		type: 'border',
		label: 'Top Divider',
		target: { kind: 'section', id: 'pagination' },
		operation: 'setSectionAttribute',
		attributePath: 'blockeraBorder.value',
		borderSide: 'top',
		mirrorMergeWhen: {
			whenControlId: 'pagination-top-spacing',
			mergeKeys: ['padding.top'],
			role: 'divider',
			attributePath: 'blockeraSpacing.value',
		},
	};
	const spacing = {
		id: 'pagination-top-spacing',
		type: 'input',
		label: 'Top Spacing',
		target: { kind: 'section', id: 'pagination' },
		operation: 'setSectionAttribute',
		attributePath: 'blockeraSpacing.value',
		attributeMergeKeys: ['margin.top'],
		mirrorMergeWhen: {
			whenControlId: 'pagination-top-divider',
			mergeKeys: ['padding.top'],
			role: 'spacing',
		},
	};
	const pairConfig = {
		type: 'archive',
		filters: ['archive'],
		layoutId: LAYOUT_ID,
		groups: [
			{
				id: 'design',
				title: 'Design',
				controls: [divider, spacing],
			},
		],
	};

	it('copies spacing into padding.top when a divider is assigned', () => {
		const blocks = [
			stamped('core/query-pagination', 'section/pagination:standard', {
				blockeraBorder: {
					value: {
						type: 'custom',
						top: { width: '1px', style: 'solid', color: '#111' },
					},
				},
			}),
		];
		const result = apply(spacing, '24px', { blocks, config: pairConfig });
		expect(
			findStamp(result.blocks, 'pagination').block.attributes
				.blockeraSpacing.value
		).toEqual(
			expect.objectContaining({
				margin: expect.objectContaining({ top: '24px' }),
				padding: expect.objectContaining({ top: '24px' }),
			})
		);
	});

	it('clears padding.top when the divider is removed', () => {
		const blocks = [
			stamped('core/query-pagination', 'section/pagination:standard', {
				blockeraBorder: {
					value: {
						type: 'custom',
						top: { width: '1px', style: 'solid', color: '#111' },
					},
				},
				blockeraSpacing: {
					value: {
						margin: { top: '24px' },
						padding: { top: '24px' },
					},
				},
			}),
		];
		const result = apply(
			divider,
			{ width: '', style: 'solid', color: '' },
			{ blocks, config: pairConfig }
		);
		expect(
			findStamp(result.blocks, 'pagination').block.attributes
				.blockeraSpacing.value.padding.top
		).toBe('');
	});

	it('does not nest the spacing box into margin.top on listing swap reapply', () => {
		const spacingControl = {
			...spacing,
			id: 'pagination-top-spacing',
		};
		const listing = {
			...CONTROLS.postsTemplate,
			swapHints: {
				preserveQuery: true,
				reapplyControls: ['pagination-top-spacing'],
			},
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'main',
					title: 'Main',
					controls: [listing, spacingControl],
				},
			],
		};
		const blocks = makeBlocks();
		const pagination = findStamp(blocks, 'pagination');
		pagination.block.attributes.blockeraSpacing = {
			value: {
				margin: { top: '24px' },
				padding: { top: '24px' },
			},
		};

		const result = apply(listing, 'grid-2', { blocks, config });
		expect(
			findStamp(result.blocks, 'pagination').block.attributes
				.blockeraSpacing.value.margin.top
		).toBe('24px');
	});
});

describe('pagination labels and midSize', () => {
	it('writes previous and next labels onto the matching inner blocks', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-previous',
				'section/pagination-previous:default'
			),
			stamped(
				'core/query-pagination-next',
				'section/pagination-next:default'
			),
		]);
		const previousLabel = {
			id: 'pagination-previous-label',
			type: 'input',
			label: 'Previous Label',
			target: { kind: 'section', id: 'pagination-previous' },
			operation: 'setSectionAttribute',
			attributePath: 'label',
			defaultValue: '',
		};
		const nextLabel = {
			id: 'pagination-next-label',
			type: 'input',
			label: 'Next Label',
			target: { kind: 'section', id: 'pagination-next' },
			operation: 'setSectionAttribute',
			attributePath: 'label',
			defaultValue: '',
		};

		const withPrev = apply(previousLabel, 'Back', { blocks });
		expect(
			findStamp(withPrev.blocks, 'pagination-previous').block.attributes
				.label
		).toBe('Back');

		const withNext = apply(nextLabel, 'Forward', {
			blocks: withPrev.blocks,
		});
		expect(
			findStamp(withNext.blocks, 'pagination-next').block.attributes.label
		).toBe('Forward');
	});

	it('writes numbers midSize including zero', () => {
		const blocks = paginationTree([
			stamped(
				'core/query-pagination-numbers',
				'section/pagination-numbers:default'
			),
		]);
		const midSize = {
			id: 'pagination-numbers-mid-size',
			type: 'number',
			label: 'Number of links',
			target: { kind: 'section', id: 'pagination-numbers' },
			operation: 'setSectionAttribute',
			attributePath: 'midSize',
			defaultValue: 2,
			min: 0,
			max: 5,
		};

		const result = apply(midSize, 0, { blocks });
		expect(
			findStamp(result.blocks, 'pagination-numbers').block.attributes
				.midSize
		).toBe(0);
	});
});
