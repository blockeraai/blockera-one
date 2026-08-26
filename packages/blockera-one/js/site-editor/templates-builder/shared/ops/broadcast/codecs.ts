/**
 * Per-broadcast-id parse/format for stored site settings.
 * Tree rewrites live in `BROADCAST_HANDLERS`; this map is settings only.
 */

import type { BroadcastId, ControlValue } from '../../types';
import { formatStoredSticky, parseHeaderSticky } from './header-sticky';
import { formatStoredWidth, parseSidebarWidth } from './sidebar-width';

export type BroadcastCodec = {
	parse: (value: ControlValue) => ControlValue | null;
	formatStored: (value: ControlValue) => string | number | boolean;
};

export const BROADCAST_CODECS = {
	'sidebar-width': {
		parse: parseSidebarWidth,
		formatStored: (value) => formatStoredWidth(value as number),
	},
	'header-sticky': {
		parse: parseHeaderSticky,
		formatStored: formatStoredSticky,
	},
} satisfies Record<BroadcastId, BroadcastCodec>;
