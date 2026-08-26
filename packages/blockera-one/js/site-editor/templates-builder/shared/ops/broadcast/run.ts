/**
 * Thin core-data glue: load templates (and parts when the id needs them),
 * plan edits, leave entities dirty.
 */

import { store as coreStore } from '@wordpress/core-data';
import { dispatch, resolveSelect } from '@wordpress/data';

import { toEntityEdits } from '../../blocks-adapter';
import type { BroadcastId, BuilderEntityPostType } from '../../types';
import type { OperationResult } from '../types';
import { planBroadcastEdits, type BroadcastRecord } from './plan';

type BroadcastResult = Extract<OperationResult, { kind: 'broadcast' }>;

type CoreSelect = {
	getEntityRecords: (
		kind: string,
		name: string,
		query?: Record<string, unknown>
	) => Promise<BroadcastRecord[] | null>;
	getEditedEntityRecord: (
		kind: string,
		name: string,
		key: string | number
	) => Promise<BroadcastRecord | undefined>;
};

/** Entity types each broadcast rewrites. Sidebar width lives on layouts. */
export const BROADCAST_ENTITY_TYPES = {
	'sidebar-width': ['wp_template'],
	'header-sticky': ['wp_template_part', 'wp_template'],
} satisfies Record<BroadcastId, BuilderEntityPostType[]>;

async function loadRecords(
	core: CoreSelect,
	entityType: BuilderEntityPostType
): Promise<BroadcastRecord[]> {
	const records =
		(await core.getEntityRecords('postType', entityType, {
			per_page: -1,
		})) || [];
	return Promise.all(
		records.map(async (record) => {
			if (record.id === undefined || record.id === null) {
				return record;
			}
			return (
				(await core.getEditedEntityRecord(
					'postType',
					entityType,
					record.id
				)) || record
			);
		})
	);
}

/**
 * Apply a broadcast across every entity type registered for the id.
 * Persistence goes through the editor's multi-entity save panel.
 */
export async function runBroadcast(result: BroadcastResult): Promise<void> {
	const core = resolveSelect(coreStore) as unknown as CoreSelect;
	const { editEntityRecord } = dispatch(coreStore) as unknown as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: string | number | undefined,
			edits: Record<string, unknown>
		) => void;
	};
	const entityTypes =
		BROADCAST_ENTITY_TYPES[result.broadcastId] ??
		(['wp_template'] as BuilderEntityPostType[]);

	for (const entityType of entityTypes) {
		let records: BroadcastRecord[] = [];
		try {
			records = await loadRecords(core, entityType);
		} catch {
			continue;
		}
		const edits = planBroadcastEdits(
			records,
			result.broadcastId,
			result.value
		);
		for (let i = 0; i < edits.length; i++) {
			const edit = edits[i];
			const payload = toEntityEdits(edit.blocks);
			editEntityRecord('postType', entityType, edit.id, {
				blocks: payload.blocks,
				content: payload.content,
			});
		}
	}

	editEntityRecord('root', 'site', undefined, result.settingsEdits);
}
