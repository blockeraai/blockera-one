/**
 * dnd-kit sensors and modifiers for Templates Builder element rows.
 */

import { PointerSensor, type Modifier } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const TOGGLE_IGNORE = '.blockera-site-editor-gateway-row__toggle';

/**
 * Same as PointerSensor, but ignore the presence toggle so a click/drag
 * there cannot start a reorder.
 */
export class RowPointerSensor extends PointerSensor {
	static override activators = [
		{
			eventName: 'onPointerDown' as const,
			handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
				if (!nativeEvent.isPrimary || nativeEvent.button !== 0) {
					return false;
				}
				const target = nativeEvent.target as HTMLElement | null;
				return !target?.closest(TOGGLE_IGNORE);
			},
		},
	];
}

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
	...transform,
	x: 0,
});

export const DND_MODIFIERS = [restrictToVerticalAxis];

export const POINTER_SENSOR_OPTIONS = {
	// Delay so a quick press stays a click; tolerance lets the
	// pointer move a bit during the hold without cancelling.
	activationConstraint: { delay: 100, tolerance: 100 },
};

export const KEYBOARD_SENSOR_OPTIONS = {
	coordinateGetter: sortableKeyboardCoordinates,
};
