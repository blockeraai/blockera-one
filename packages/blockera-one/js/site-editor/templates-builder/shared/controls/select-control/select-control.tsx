/**
 * Native Blockera SelectControl row (style variation and similar).
 */

import { useMemo } from '@wordpress/element';

import { ControlContextProvider, SelectControl } from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';

export type SelectOption = {
	label: string;
	value: string;
};

type SelectControlRowProps = {
	controlId: string;
	label?: string;
	value: string | null;
	options: SelectOption[];
	disabled?: boolean;
	defaultValue?: string;
	columns?: string;
	onChange: (next: string) => void;
};

export default function SelectControlRow({
	controlId,
	label,
	value,
	options,
	disabled,
	defaultValue = '',
	columns = CONTROL_COLUMNS,
	onChange,
}: SelectControlRowProps) {
	const resolvedValue = value ?? defaultValue;
	// ControlContextProvider's useSelect deps on this object identity.
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: resolvedValue,
		}),
		[controlId, resolvedValue]
	);

	return (
		<ControlContextProvider value={contextValue}>
			<SelectControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				className="blockera-templates-builder-select"
				data-test="blockera-templates-builder-select"
				type="native"
				options={options}
				defaultValue={defaultValue}
				disabled={disabled}
				onChange={onChange}
			/>
		</ControlContextProvider>
	);
}
