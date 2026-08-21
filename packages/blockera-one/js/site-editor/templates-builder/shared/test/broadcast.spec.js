/**
 * Broadcast engine: sidebar-width handler, planner, and dispatcher result.
 */

import { applyOperation } from '../ops/apply-operation';
import {
	applyHeaderSticky,
	applySidebarWidth,
	planBroadcastEdits,
} from '../ops/broadcast';
import { TEMPLATE_SETTINGS_KEY } from '../constants';
import { stamped } from './helpers/block-fixtures';

function sidebarTree(
	side = 'right',
	sidebarWidth = '33.33%',
	contentWidth = '66.66%'
) {
	const content = stamped(
		'core/column',
		'container/content-column',
		{ width: contentWidth },
		[stamped('core/group', 'area/content')]
	);
	const sidebar = stamped(
		'core/column',
		'container/sidebar-column',
		{ width: sidebarWidth },
		[stamped('core/group', 'area/sidebar-area')]
	);
	const columns = side === 'left' ? [sidebar, content] : [content, sidebar];
	return [
		stamped(
			'core/group',
			`layout/main:sidebar-${side}`,
			{ tagName: 'main' },
			[stamped('core/columns', 'container/layout-columns', {}, columns)]
		),
	];
}

function noSidebarTree() {
	return [
		stamped('core/group', 'layout/main:no-sidebar', { tagName: 'main' }, [
			stamped('core/group', 'area/content'),
		]),
	];
}

describe('applySidebarWidth', () => {
	it('sets sidebar and complement content widths on sidebar-right', () => {
		const next = applySidebarWidth(sidebarTree('right'), 30);
		expect(next).not.toBeNull();
		const widths = collectWidths(next);
		expect(widths.sidebar).toBe('30%');
		expect(widths.content).toBe('70%');
	});

	it('is order-agnostic for sidebar-left', () => {
		const next = applySidebarWidth(sidebarTree('left'), '25%');
		const widths = collectWidths(next);
		expect(widths.sidebar).toBe('25%');
		expect(widths.content).toBe('75%');
	});

	it('returns null when there is no sidebar column', () => {
		expect(applySidebarWidth(noSidebarTree(), 30)).toBeNull();
	});

	it('returns null when widths are already the target', () => {
		const tree = sidebarTree('right', '30%', '70%');
		expect(applySidebarWidth(tree, 30)).toBeNull();
	});
});

describe('planBroadcastEdits', () => {
	it('edits trees with a sidebar and skips the rest', () => {
		const edits = planBroadcastEdits(
			[
				{ id: 1, blocks: sidebarTree('right') },
				{ id: 2, blocks: noSidebarTree() },
				{ id: 3, blocks: sidebarTree('right', '30%', '70%') },
				{ blocks: sidebarTree('left') },
			],
			'sidebar-width',
			30
		);
		expect(edits.map((e) => e.id)).toEqual([1]);
		expect(collectWidths(edits[0].blocks).sidebar).toBe('30%');
	});
});

describe('applyOperation broadcastSetting', () => {
	it('returns a broadcast result with merged settingsEdits', () => {
		const result = applyOperation({
			blocks: [],
			control: {
				id: 'sidebar-width',
				type: 'number',
				target: { kind: 'setting', id: 'sidebar-width' },
				operation: 'broadcastSetting',
				broadcastId: 'sidebar-width',
				settingPath: 'sidebar_width',
			},
			nextValue: 30,
			config: {
				type: 'global-sidebar',
				filters: [],
				layoutId: 'site-sidebar',
				groups: [],
			},
			settings: { posts_per_page: { archive: 12 } },
			settingBucket: 'archive',
			needsConfirm: false,
		});
		expect(result.kind).toBe('broadcast');
		expect(result.broadcastId).toBe('sidebar-width');
		expect(result.value).toBe(30);
		expect(result.settingsEdits).toEqual({
			[TEMPLATE_SETTINGS_KEY]: {
				posts_per_page: { archive: 12 },
				sidebar_width: '30',
			},
		});
	});
});

function collectWidths(blocks) {
	const walk = (nodes, found = {}) => {
		for (const node of nodes || []) {
			const stamp = node.attributes?.metadata?.blockeraOne || '';
			if (stamp.includes('sidebar-column')) {
				found.sidebar = node.attributes.width;
			}
			if (stamp.includes('content-column')) {
				found.content = node.attributes.width;
			}
			walk(node.innerBlocks, found);
		}
		return found;
	};
	return walk(blocks);
}

describe('applyHeaderSticky', () => {
	it('sets sticky position on the header part root', () => {
		const tree = [
			stamped('core/group', 'layout/site-header:default', {
				className: 'wp-block-group',
			}),
		];
		const next = applyHeaderSticky(tree, true);
		expect(next).not.toBeNull();
		expect(next[0].attributes.className).toContain('is-position-sticky');
		expect(next[0].attributes.style.position).toEqual({
			type: 'sticky',
			top: '0px',
		});
	});

	it('returns null when already sticky', () => {
		const tree = [
			stamped('core/group', 'layout/site-header:default', {
				className: 'is-position-sticky',
				style: { position: { type: 'sticky', top: '0px' } },
			}),
		];
		expect(applyHeaderSticky(tree, true)).toBeNull();
	});
});
