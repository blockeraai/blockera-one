/**
 * runBroadcast awaits resolveSelect before planning edits.
 */

const mockGetEntityRecords = jest.fn();
const mockGetEditedEntityRecord = jest.fn();
const mockEditEntityRecord = jest.fn();

jest.mock('@wordpress/blocks', () => ({
	getBlockType: () => undefined,
	createBlock: () => ({}),
	parse: () => [],
	serialize: () => '',
}));
jest.mock('@wordpress/core-data', () => ({
	store: 'core',
}));
jest.mock('@wordpress/data', () => ({
	combineReducers: () => (state) => state,
	resolveSelect: () => ({
		getEntityRecords: mockGetEntityRecords,
		getEditedEntityRecord: mockGetEditedEntityRecord,
	}),
	dispatch: () => ({ editEntityRecord: mockEditEntityRecord }),
}));
jest.mock('../blocks-adapter', () => ({
	toEntityEdits: (blocks) => ({ blocks, content: 'serialized' }),
	parseBlocks: () => [],
}));

import { TEMPLATE_SETTINGS_KEY } from '../constants';
import { runBroadcast } from '../ops/broadcast';
import { stamped } from './helpers/block-fixtures';

function sidebarTree() {
	return [
		stamped(
			'core/group',
			'layout/main:sidebar-right',
			{ tagName: 'main' },
			[
				stamped('core/columns', 'container/layout-columns', {}, [
					stamped(
						'core/column',
						'container/content-column',
						{ width: '66.66%' },
						[stamped('core/group', 'area/content')]
					),
					stamped(
						'core/column',
						'container/sidebar-column',
						{ width: '33.33%' },
						[stamped('core/group', 'area/sidebar-area')]
					),
				]),
			]
		),
	];
}

describe('runBroadcast', () => {
	beforeEach(() => {
		mockGetEntityRecords.mockReset();
		mockGetEditedEntityRecord.mockReset();
		mockEditEntityRecord.mockReset();
	});

	it('awaits resolved template records before planning edits', async () => {
		mockGetEntityRecords.mockResolvedValue([
			{ id: 11, blocks: sidebarTree() },
			{ id: 12, blocks: sidebarTree() },
		]);
		mockGetEditedEntityRecord.mockImplementation((_kind, _name, id) =>
			Promise.resolve({ id, blocks: sidebarTree() })
		);

		await runBroadcast({
			kind: 'broadcast',
			broadcastId: 'sidebar-width',
			value: 30,
			settingsEdits: {
				[TEMPLATE_SETTINGS_KEY]: { sidebar_width: '30' },
			},
		});

		expect(mockGetEntityRecords).toHaveBeenCalledWith(
			'postType',
			'wp_template',
			{ per_page: -1 }
		);
		expect(mockGetEditedEntityRecord).toHaveBeenCalledTimes(2);
		expect(mockEditEntityRecord).toHaveBeenCalledWith(
			'postType',
			'wp_template',
			11,
			expect.objectContaining({ content: 'serialized' })
		);
		expect(mockEditEntityRecord).toHaveBeenCalledWith(
			'root',
			'site',
			undefined,
			{ [TEMPLATE_SETTINGS_KEY]: { sidebar_width: '30' } }
		);
	});

	it('still writes settings when record loading throws', async () => {
		mockGetEntityRecords.mockRejectedValue(new Error('network'));

		await runBroadcast({
			kind: 'broadcast',
			broadcastId: 'sidebar-width',
			value: 30,
			settingsEdits: {
				[TEMPLATE_SETTINGS_KEY]: { sidebar_width: '30' },
			},
		});

		expect(mockEditEntityRecord).toHaveBeenCalledWith(
			'root',
			'site',
			undefined,
			{ [TEMPLATE_SETTINGS_KEY]: { sidebar_width: '30' } }
		);
		expect(mockEditEntityRecord).not.toHaveBeenCalledWith(
			'postType',
			'wp_template',
			expect.anything(),
			expect.anything()
		);
	});

	it('loads template parts then templates for header-sticky', async () => {
		mockGetEntityRecords.mockResolvedValue([]);

		await runBroadcast({
			kind: 'broadcast',
			broadcastId: 'header-sticky',
			value: true,
			settingsEdits: {
				[TEMPLATE_SETTINGS_KEY]: { header_sticky: '1' },
			},
		});

		expect(mockGetEntityRecords.mock.calls.map((call) => call[1])).toEqual([
			'wp_template_part',
			'wp_template',
		]);
	});
});
