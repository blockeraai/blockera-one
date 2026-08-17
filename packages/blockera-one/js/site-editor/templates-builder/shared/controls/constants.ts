/** Label / field grid for Blockera inspector-style controls in this folder. */
export const CONTROL_COLUMNS = '1.4fr 2fr';

/** BaseControl stacked token — label above field (`columns-1`). */
export const CONTROL_COLUMNS_1 = 'columns-1';

/**
 * BaseControl hides an empty label. Drop the 2-col grid so the field is
 * full width instead of sitting in the leftover label column.
 */
export function fieldColumns(
	label: string | undefined,
	columns: string
): string {
	return label ? columns : '';
}
