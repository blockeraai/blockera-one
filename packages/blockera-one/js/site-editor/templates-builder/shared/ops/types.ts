/**
 * Operation dispatcher argument and result types.
 */

import type { TemplateSettingsRecord } from '../constants';
import type { ElementBucket } from '../element-order';
import type {
	BlockNode,
	BroadcastId,
	ControlDef,
	ControlValue,
	TemplateOptionsConfig,
} from '../types';
import type { EditorSessionApi } from '../../../session';

export type ApplyOperationArgs = {
	blocks: BlockNode[];
	control: ControlDef;
	nextValue: ControlValue;
	config: TemplateOptionsConfig;
	settings: TemplateSettingsRecord;
	settingBucket: string;
	needsConfirm: boolean;
	selectedClientId?: string | null;
	/** Frozen display order for sortable toggles (off-at-end visit freeze). */
	orderBuckets?: ElementBucket[];
	session?: EditorSessionApi;
	entityKey?: string;
	entityDirty?: boolean;
};

export type OperationResult =
	| { kind: 'blocks'; blocks: BlockNode[] }
	| { kind: 'site-edits'; edits: Record<string, unknown> }
	| {
			kind: 'broadcast';
			broadcastId: BroadcastId;
			value: ControlValue;
			settingsEdits: Record<string, unknown>;
	  }
	| null;

export type OperationHandler = (args: ApplyOperationArgs) => OperationResult;
