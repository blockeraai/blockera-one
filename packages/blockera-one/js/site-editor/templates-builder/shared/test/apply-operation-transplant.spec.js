/**
 * applyOperation transplantLayout.
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

import { apply, CONTROLS, LAYOUT_ID } from './helpers/apply-operation-setup';
import { getStamp } from '../metadata';
import { findStamp } from './helpers/block-fixtures';

describe('transplantLayout', () => {
	it('maps toggle on/off to the onValue/offValue variants', () => {
		const on = apply(CONTROLS.sidebarToggle, true);
		expect(on.kind).toBe('blocks');
		expect(getStamp(findStamp(on.blocks, LAYOUT_ID).block).variant).toBe(
			'sidebar-right'
		);
		// Area content survives the toggle.
		expect(findStamp(on.blocks, 'posts-listing')).not.toBeNull();

		const off = apply(CONTROLS.sidebarToggle, false);
		expect(getStamp(findStamp(off.blocks, LAYOUT_ID).block).variant).toBe(
			'no-sidebar'
		);
	});

	it('supports non-toggle layout pickers and rejects unknown variants', () => {
		const picker = {
			...CONTROLS.sidebarToggle,
			type: 'layout-picker',
			onValue: undefined,
			offValue: undefined,
		};
		const result = apply(picker, 'sidebar-right');
		expect(
			getStamp(findStamp(result.blocks, LAYOUT_ID).block).variant
		).toBe('sidebar-right');

		expect(apply(picker, 'does-not-exist')).toBeNull();
	});

	it('re-applies stored sidebar_width when a sidebar layout is introduced', () => {
		const result = apply(CONTROLS.sidebarToggle, true, {
			settings: { sidebar_width: '30' },
		});
		expect(result.kind).toBe('blocks');
		expect(
			findStamp(result.blocks, 'sidebar-column').block.attributes.width
		).toBe('30%');
		expect(
			findStamp(result.blocks, 'content-column').block.attributes.width
		).toBe('70%');
	});

	it('re-applies the 33.33 default when sidebar_width is unset', () => {
		const result = apply(CONTROLS.sidebarToggle, true, {
			settings: {},
		});
		expect(result.kind).toBe('blocks');
		expect(
			findStamp(result.blocks, 'sidebar-column').block.attributes.width
		).toBe('33.33%');
		expect(
			findStamp(result.blocks, 'content-column').block.attributes.width
		).toBe('66.67%');
	});
});
