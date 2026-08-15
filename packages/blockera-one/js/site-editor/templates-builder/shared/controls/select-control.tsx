/**
 * Native Blockera SelectControl row (style variation and similar).
 */

import { ControlContextProvider, SelectControl } from '@blockera/controls';

import { CONTROL_COLUMNS } from './constants';

export type SelectOption = {
	label: string;
	value: string;
};

type SelectControlRowProps = {
	controlId: string;
	label: string;
	value: string | null;
	options: SelectOption[];
	disabled?: boolean;
	defaultValue?: string;
	onChange: (next: string) => void;
};

export default function SelectControlRow({
	controlId,
	label,
	value,
	options,
	disabled,
	defaultValue = '',
	onChange,
}: SelectControlRowProps) {
	return (
		<div
			className="blockera-templates-builder-select"
			data-test="blockera-templates-builder-select"
		>
			<ControlContextProvider
				value={{
					name: `templates-builder-${controlId}`,
					value: value ?? defaultValue,
				}}
			>
				<SelectControl
					label={label}
					columns={CONTROL_COLUMNS}
					type="native"
					options={options}
					defaultValue={defaultValue}
					disabled={disabled}
					onChange={(next: string) => onChange(next)}
				/>
			</ControlContextProvider>
		</div>
	);
}
