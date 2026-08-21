/**
 * broadcastSetting — store a setting and rewrite other templates.
 */

import { TEMPLATE_SETTINGS_KEY } from '../../constants';
import type { OperationHandler } from '../types';
import { BROADCAST_CODECS } from '../broadcast/codecs';

export const handleBroadcastSetting: OperationHandler = ({
	control,
	nextValue,
	settings,
}) => {
	if (!control.broadcastId) {
		return null;
	}
	const codec = BROADCAST_CODECS[control.broadcastId];
	if (!codec) {
		return null;
	}
	const parsed = codec.parse(nextValue);
	if (parsed === null) {
		return null;
	}
	const path = control.settingPath || control.broadcastId.replace(/-/g, '_');
	return {
		kind: 'broadcast',
		broadcastId: control.broadcastId,
		value: parsed,
		settingsEdits: {
			[TEMPLATE_SETTINGS_KEY]: {
				...(settings as object),
				[path]: codec.formatStored(parsed),
			},
		},
	};
};
