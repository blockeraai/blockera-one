/**
 * fieldColumns: unlabeled controls drop the 2-col label/field grid so
 * BaseControl unwraps the field to full width.
 */

import {
	CONTROL_COLUMNS,
	CONTROL_COLUMNS_1,
	fieldColumns,
} from '../controls/constants';

describe('fieldColumns', () => {
	it('keeps the authored grid when a label is set', () => {
		expect(fieldColumns('Gap', CONTROL_COLUMNS)).toBe(CONTROL_COLUMNS);
		expect(fieldColumns('Header', CONTROL_COLUMNS_1)).toBe(
			CONTROL_COLUMNS_1
		);
	});

	it('drops the grid when the label is omitted or empty', () => {
		expect(fieldColumns(undefined, CONTROL_COLUMNS)).toBe('');
		expect(fieldColumns('', CONTROL_COLUMNS_1)).toBe('');
	});
});
