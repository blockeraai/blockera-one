/**
 * applyOperation swapSection / swapTemplatePart / listing reapply.
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
} from './helpers/apply-operation-setup';
import { __setMarkup } from '../blocks-adapter';
import { getStamp } from '../metadata';
import { findStamp, stamped } from './helpers/block-fixtures';
import {
	createSessionBag,
	sessionSwapKey,
	sessionSwapCleanCurrentKey,
} from '../../../session';

describe('swapSection', () => {
	it('swaps the listing and re-applies pagination elements', () => {
		// Grid markup ships an empty pagination wrapper; the hint restores
		// the user's previous / numbers / next inner blocks.
		const result = apply(CONTROLS.postsTemplate, 'grid-2');

		const listing = findStamp(result.blocks, 'posts-listing');
		expect(getStamp(listing.block).variant).toBe('grid-2');

		const pagination = findStamp(result.blocks, 'pagination');
		expect(getStamp(pagination.block).variant).toBe('standard');
		expect(findStamp(result.blocks, 'pagination-previous')).not.toBeNull();
		expect(findStamp(result.blocks, 'pagination-numbers')).not.toBeNull();
		expect(findStamp(result.blocks, 'pagination-next')).not.toBeNull();
	});

	it('applies Icons to post-meta when swapping to full-width', () => {
		const result = apply(CONTROLS.postsTemplate, 'full-width');
		expect(
			getStamp(findStamp(result.blocks, 'posts-listing').block).variant
		).toBe('full-width');
		expect(findStamp(result.blocks, 'meta-item-icon')).not.toBeNull();
		expect(
			findStamp(result.blocks, 'meta-item-icon').block.attributes
				.blockeraIcon.value
		).toMatchObject({ icon: 'calendar', library: 'wp' });
	});

	it('does not swap a disabled catalog tile', () => {
		expect(apply(CONTROLS.paginationDesign, 'load-more')).toBeNull();
	});

	it('skips the re-apply when the dependent already uses its default', () => {
		const blocks = makeBlocks();
		const listing = findStamp(blocks, 'posts-listing');
		listing.block.innerBlocks[0].attributes.metadata.blockeraOne = {
			stamp: 'section/pagination:standard',
		};

		const result = apply(CONTROLS.postsTemplate, 'grid-2', { blocks });
		const pagination = findStamp(result.blocks, 'pagination');
		expect(getStamp(pagination.block).variant).toBe('standard');
	});

	it('returns null for an unknown variant id', () => {
		expect(apply(CONTROLS.postsTemplate, 'nope')).toBeNull();
	});

	it('attaches a localReplace payload when the listing has a clientId', () => {
		const blocks = makeBlocks();
		const listing = findStamp(blocks, 'posts-listing');
		listing.block.clientId = 'listing-live';
		const layout = findStamp(blocks, 'main');
		layout.block.clientId = 'layout-live';
		const result = apply(CONTROLS.postsTemplate, 'grid-2', { blocks });
		expect(result.localReplace.clientId).toBe('listing-live');
		expect(getStamp(result.localReplace.blocks[0]).variant).toBe('grid-2');
	});

	it('does not carry previous blockera* attrs onto the new pattern by default', () => {
		__setMarkup('page-header-banner', [
			stamped('core/group', 'section/page-header:banner', {
				blockeraFlexLayout: {
					value: {
						direction: 'column',
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
			}),
		]);
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {
				blockeraFlexLayout: {
					value: {
						direction: 'column',
						alignItems: 'flex-start',
						justifyContent: 'center',
					},
				},
				blockeraFontColor: { value: '#abc' },
			}),
		];
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-simple' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [design],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraFlexLayout
		).toEqual({
			value: {
				direction: 'column',
				alignItems: 'center',
				justifyContent: 'center',
			},
		});
		expect(
			findStamp(result.blocks, 'page-header').block.attributes
				.blockeraFontColor
		).toBeUndefined();
	});
});

describe('swapTemplatePart', () => {
	it('delegates to the chrome swap (slug + stamp forced to the variant)', () => {
		const result = apply(CONTROLS.headerDesign, 'header-large');
		const header = findStamp(result.blocks, 'header');

		expect(header.block.attributes.slug).toBe('header-large');
		expect(getStamp(header.block).variant).toBe('header-large');
	});

	it('returns null for an unknown variant id', () => {
		expect(apply(CONTROLS.headerDesign, 'nope')).toBeNull();
	});
});
describe('swapSection reapply toggles', () => {
	beforeAll(() => {
		__setMarkup('page-header-banner', [
			stamped('core/group', 'section/page-header:banner', {}, [
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		]);
		__setMarkup('page-header-title', [
			stamped('core/query-title', 'section/page-header-title:default'),
		]);
	});

	it('re-applies an inner title toggle-off after a design swap', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		];
		const titleToggle = {
			id: 'page-header-title',
			type: 'toggle',
			label: 'Title',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'toggleSection',
			catalogPool: 'page-header-title',
			variants: [
				{ id: 'default', label: 'Title', html: 'page-header-title' },
			],
			insert: { relativeTo: 'page-header', position: 'inside-start' },
		};
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-default' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
			swapHints: { reapplyControls: ['page-header-title'] },
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [design, titleToggle],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		expect(findStamp(result.blocks, 'page-header-title')).toBeNull();
		expect(
			findStamp(result.blocks, 'page-header-description')
		).not.toBeNull();
	});

	it('re-applies breadcrumbs on-state after a design swap using the new pattern order', () => {
		__setMarkup('page-header-breadcrumbs', [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		]);

		const innerOrder = {
			parentId: 'page-header',
			ids: [
				'page-header-title',
				'page-header-description',
				'page-header-breadcrumbs',
			],
		};
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-header-breadcrumbs:default'
				),
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default'
				),
			]),
		];
		const breadcrumbToggle = {
			id: 'page-header-breadcrumbs',
			type: 'toggle',
			label: 'Breadcrumbs',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'toggleSection',
			variants: [
				{
					id: 'default',
					label: 'Breadcrumbs',
					html: 'page-header-breadcrumbs',
				},
			],
			insert: { relativeTo: 'page-header', position: 'inside-end' },
			innerOrder,
		};
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-default' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
			swapHints: {
				reapplyControls: ['page-header-breadcrumbs'],
			},
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [design, breadcrumbToggle],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		expect(result.blocks[0].innerBlocks.map((b) => b.name)).toEqual([
			'core/query-title',
			'core/term-description',
			'core/breadcrumbs',
		]);
	});

	it('re-applies breadcrumbs attributes and style after a design swap', () => {
		__setMarkup('page-header-breadcrumbs', [
			stamped(
				'core/breadcrumbs',
				'section/page-header-breadcrumbs:default'
			),
		]);

		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/breadcrumbs',
					'section/page-header-breadcrumbs:default',
					{
						separator: '>',
						showHomeItem: false,
						className: 'blockera-block is-style-underline',
						blockeraFontColor: { value: '#111111' },
						blockeraFontSize: { value: '14px' },
					}
				),
				stamped(
					'core/query-title',
					'section/page-header-title:default'
				),
			]),
		];
		const breadcrumbToggle = {
			id: 'page-header-breadcrumbs',
			type: 'toggle',
			label: 'Breadcrumbs',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'toggleSection',
			variants: [
				{
					id: 'default',
					label: 'Breadcrumbs',
					html: 'page-header-breadcrumbs',
				},
			],
			insert: { relativeTo: 'page-header', position: 'inside-end' },
		};
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
			label: 'Show home',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setSectionAttribute',
			attributePath: 'showHomeItem',
			defaultValue: true,
		};
		const style = {
			id: 'breadcrumbs-style',
			type: 'select',
			label: 'Style variation',
			target: { kind: 'section', id: 'page-header-breadcrumbs' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
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
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-default' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
			swapHints: {
				reapplyControls: [
					'page-header-breadcrumbs',
					'breadcrumbs-separator',
					'breadcrumbs-show-home',
					'breadcrumbs-style',
					'breadcrumbs-color',
					'breadcrumbs-font-size',
				],
			},
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [
						design,
						breadcrumbToggle,
						separator,
						showHome,
						style,
						color,
						fontSize,
					],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		const crumb = findStamp(result.blocks, 'page-header-breadcrumbs').block;
		expect(crumb.attributes.separator).toBe('>');
		expect(crumb.attributes.showHomeItem).toBe(false);
		expect(crumb.attributes.className).toContain('is-style-underline');
		expect(crumb.attributes.blockeraFontColor).toEqual({
			value: '#111111',
		});
		expect(crumb.attributes.blockeraFontSize).toEqual({ value: '14px' });
	});

	it('re-applies title and description attributes and style after a design swap', () => {
		const blocks = [
			stamped('core/group', 'section/page-header:default', {}, [
				stamped(
					'core/query-title',
					'section/page-header-title:default',
					{
						className: 'blockera-block is-style-underline',
						blockeraFontColor: { value: '#111111' },
						blockeraBackgroundColor: { value: '#eeeeee' },
						blockeraFontSize: { value: '32px' },
					}
				),
				stamped(
					'core/term-description',
					'section/page-header-description:default',
					{
						className: 'blockera-block is-style-plain',
						blockeraFontColor: { value: '#333333' },
						blockeraBackgroundColor: { value: '#fafafa' },
						blockeraFontSize: { value: '16px' },
					}
				),
			]),
		];
		const titleColor = {
			id: 'title-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const titleBg = {
			id: 'title-bg-color',
			type: 'color',
			label: 'BG Color',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraBackgroundColor.value',
		};
		const titleSize = {
			id: 'title-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};
		const titleStyle = {
			id: 'title-style',
			type: 'select',
			label: 'Style',
			target: { kind: 'section', id: 'page-header-title' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const descriptionColor = {
			id: 'description-color',
			type: 'color',
			label: 'Text Color',
			target: { kind: 'section', id: 'page-header-description' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontColor.value',
		};
		const descriptionBg = {
			id: 'description-bg-color',
			type: 'color',
			label: 'BG Color',
			target: { kind: 'section', id: 'page-header-description' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraBackgroundColor.value',
		};
		const descriptionSize = {
			id: 'description-font-size',
			type: 'input',
			label: 'Font Size',
			target: { kind: 'section', id: 'page-header-description' },
			operation: 'setSectionAttribute',
			attributePath: 'blockeraFontSize.value',
		};
		const descriptionStyle = {
			id: 'description-style',
			type: 'select',
			label: 'Style',
			target: { kind: 'section', id: 'page-header-description' },
			operation: 'setBlockStyle',
			defaultValue: 'default',
		};
		const design = {
			id: 'page-header-design',
			type: 'layout-picker',
			label: 'Header Design',
			target: { kind: 'section', id: 'page-header' },
			operation: 'swapSection',
			variants: [
				{ id: 'simple', label: 'Simple', html: 'page-header-default' },
				{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
			],
			swapHints: {
				reapplyControls: [
					'title-color',
					'title-bg-color',
					'title-font-size',
					'title-style',
					'description-color',
					'description-bg-color',
					'description-font-size',
					'description-style',
				],
			},
		};
		const config = {
			type: 'archive',
			filters: ['archive'],
			layoutId: LAYOUT_ID,
			groups: [
				{
					id: 'page-header',
					title: 'Page Header',
					controls: [
						design,
						titleColor,
						titleBg,
						titleSize,
						titleStyle,
						descriptionColor,
						descriptionBg,
						descriptionSize,
						descriptionStyle,
					],
				},
			],
		};

		const result = apply(design, 'banner', { blocks, config });
		const title = findStamp(result.blocks, 'page-header-title').block;
		expect(title.attributes.className).toContain('is-style-underline');
		expect(title.attributes.blockeraFontColor).toEqual({
			value: '#111111',
		});
		expect(title.attributes.blockeraBackgroundColor).toEqual({
			value: '#eeeeee',
		});
		expect(title.attributes.blockeraFontSize).toEqual({ value: '32px' });

		const description = findStamp(
			result.blocks,
			'page-header-description'
		).block;
		expect(description.attributes.className).toContain('is-style-plain');
		expect(description.attributes.blockeraFontColor).toEqual({
			value: '#333333',
		});
		expect(description.attributes.blockeraBackgroundColor).toEqual({
			value: '#fafafa',
		});
		expect(description.attributes.blockeraFontSize).toEqual({
			value: '16px',
		});
	});
});

describe('swapSection session snapshots', () => {
	const entity = 'wp_template:99';
	const design = {
		id: 'page-header-design',
		type: 'layout-picker',
		target: { kind: 'section', id: 'page-header' },
		operation: 'swapSection',
		innerOrder: { parentId: 'page-header', ids: [], within: 'page-header' },
		variants: [
			{ id: 'simple', label: 'Simple', html: 'page-header-simple' },
			{ id: 'banner', label: 'Banner', html: 'page-header-banner' },
		],
	};
	const config = {
		type: 'archive',
		filters: ['archive'],
		layoutId: LAYOUT_ID,
		groups: [
			{ id: 'page-header', title: 'Page Header', controls: [design] },
		],
	};

	beforeAll(() => {
		__setMarkup('page-header-simple', [
			stamped('core/group', 'section/page-header:simple'),
		]);
		__setMarkup('page-header-banner', [
			stamped('core/group', 'section/page-header:banner'),
		]);
	});

	it('does not store a snapshot that matches catalog HTML', () => {
		const session = createSessionBag();
		const blocks = [stamped('core/group', 'section/page-header:simple')];
		apply(design, 'banner', { blocks, config, session, entityKey: entity });
		expect(
			session.get(
				sessionSwapKey(entity, 'page-header', 'page-header', 'simple')
			)
		).toBeUndefined();
	});

	it('parks a saved customization without marking it session-edited', () => {
		const session = createSessionBag();
		const simpleKey = sessionSwapKey(
			entity,
			'page-header',
			'page-header',
			'simple'
		);
		const saved = stamped('core/group', 'section/page-header:simple', {
			customTitle: 'Saved',
		});
		apply(design, 'banner', {
			blocks: [saved],
			config,
			session,
			entityKey: entity,
			entityDirty: false,
		});
		const stored = session.get(simpleKey);
		expect(stored.tree[0].attributes.customTitle).toBe('Saved');
		expect(stored.sessionEdited).toBe(false);
	});

	it('marks a clean restore and parks it without session-edited on the next swap', () => {
		const session = createSessionBag();
		const saved = stamped('core/group', 'section/page-header:simple', {
			customTitle: 'Saved',
		});
		const away = apply(design, 'banner', {
			blocks: [saved],
			config,
			session,
			entityKey: entity,
			entityDirty: false,
		});
		const restored = apply(design, 'simple', {
			blocks: away.blocks,
			config,
			session,
			entityKey: entity,
			entityDirty: true,
		});
		expect(session.get(sessionSwapCleanCurrentKey(entity))).toEqual({
			sectionId: 'page-header',
			variantId: 'simple',
		});

		apply(design, 'banner', {
			blocks: restored.blocks,
			config,
			session,
			entityKey: entity,
			entityDirty: true,
		});
		const parked = session.get(
			sessionSwapKey(entity, 'page-header', 'page-header', 'simple')
		);
		expect(parked.sessionEdited).toBe(false);
	});

	it('clears the clean-restore marker on a non-swap operation', () => {
		const session = createSessionBag();
		session.set(sessionSwapCleanCurrentKey(entity), {
			sectionId: 'page-header',
			variantId: 'simple',
		});
		apply(CONTROLS.headerToggle, false, {
			session,
			entityKey: entity,
		});
		expect(session.get(sessionSwapCleanCurrentKey(entity))).toBeUndefined();
	});

	it('stores a dirty outgoing tree, restores it, remaps ids, and deletes the key', () => {
		const session = createSessionBag();
		const bannerKey = sessionSwapKey(
			entity,
			'page-header',
			'page-header',
			'banner'
		);
		const dirtyBanner = stamped(
			'core/group',
			'section/page-header:banner',
			{
				clientId: 'old-banner',
				blockeraId: 'old-banner',
				customTitle: 'Edited',
			}
		);
		const first = apply(design, 'simple', {
			blocks: [dirtyBanner],
			config,
			session,
			entityKey: entity,
		});
		expect(
			getStamp(findStamp(first.blocks, 'page-header').block).variant
		).toBe('simple');
		const stored = session.get(bannerKey);
		expect(stored.tree[0].attributes.customTitle).toBe('Edited');
		expect(stored.sessionEdited).toBe(true);

		const restored = apply(design, 'banner', {
			blocks: first.blocks,
			config,
			session,
			entityKey: entity,
		});
		const live = findStamp(restored.blocks, 'page-header').block;
		expect(live.attributes.customTitle).toBe('Edited');
		expect(live.clientId).not.toBe('old-banner');
		expect(session.get(bannerKey)).toBeUndefined();
	});

	it('restores a snapshot at the target variant placement, not the live path', () => {
		const session = createSessionBag();
		const placed = {
			...design,
			variants: [
				{
					id: 'simple',
					label: 'Simple',
					html: 'page-header-simple',
					placement: {
						relativeTo: 'content',
						position: 'inside-start',
					},
				},
				{
					id: 'banner',
					label: 'Banner',
					html: 'page-header-banner',
					placement: {
						relativeTo: 'main',
						position: 'inside-start',
					},
				},
			],
		};
		const blocks = [
			stamped('core/group', `layout/${LAYOUT_ID}:sidebar-right`, {}, [
				stamped('core/group', 'area/content', {}, [
					stamped('core/group', 'section/page-header:simple', {
						customTitle: 'Edited',
					}),
				]),
				stamped('core/group', 'area/sidebar', {}, []),
			]),
		];
		const bannered = apply(placed, 'banner', {
			blocks,
			config,
			session,
			entityKey: entity,
		});
		expect(
			getStamp(findStamp(bannered.blocks, 'page-header').block).variant
		).toBe('banner');
		expect(
			getStamp(findStamp(bannered.blocks, LAYOUT_ID).block.innerBlocks[0])
				.id
		).toBe('page-header');

		const restored = apply(placed, 'simple', {
			blocks: bannered.blocks,
			config,
			session,
			entityKey: entity,
		});
		const content = findStamp(restored.blocks, 'content').block;
		expect(getStamp(content.innerBlocks[0]).id).toBe('page-header');
		expect(content.innerBlocks[0].attributes.customTitle).toBe('Edited');
		expect(
			getStamp(findStamp(restored.blocks, LAYOUT_ID).block.innerBlocks[0])
				.id
		).toBe('content');
	});

	it('does not snapshot or restore when the design is already current', () => {
		const session = createSessionBag();
		const simpleKey = sessionSwapKey(
			entity,
			'page-header',
			'page-header',
			'simple'
		);
		session.set(simpleKey, [
			stamped('core/group', 'section/page-header:simple', {
				customTitle: 'Parked',
			}),
		]);
		const blocks = [
			stamped('core/group', 'section/page-header:simple', {
				customTitle: 'Live',
			}),
		];
		const result = apply(design, 'simple', {
			blocks,
			config,
			session,
			entityKey: entity,
		});
		expect(result).toBeNull();
		expect(session.get(simpleKey)[0].attributes.customTitle).toBe('Parked');
	});
});
