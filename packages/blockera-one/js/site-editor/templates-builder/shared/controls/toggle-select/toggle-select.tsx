/**
 * Top/Bottom (and similar) — Blockera ToggleSelectControl.
 */

import { useMemo } from '@wordpress/element';

import {
	ControlContextProvider,
	ToggleSelectControl,
} from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';
import type { VariantDef } from '../../types';

type ToggleSelectRowProps = {
	controlId: string;
	label?: string;
	value: string | null;
	variants: VariantDef[];
	disabled?: boolean;
	defaultValue?: string;
	columns?: string;
	onChange: (next: string) => void;
};

export default function ToggleSelectRow({
	controlId,
	label,
	value,
	variants,
	disabled,
	defaultValue = '',
	columns = CONTROL_COLUMNS,
	onChange,
}: ToggleSelectRowProps) {
	const resolvedValue = value ?? defaultValue;
	// ControlContextProvider's useSelect deps on this object identity.
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: resolvedValue,
		}),
		[controlId, resolvedValue]
	);
	const options = useMemo(
		() =>
			variants.map((variant) => ({
				label: variant.label,
				value: variant.id,
				disabled,
			})),
		[variants, disabled]
	);

	return (
		<ControlContextProvider value={contextValue}>
			<ToggleSelectControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				className="blockera-templates-builder-toggle-select"
				data-test="blockera-templates-builder-toggle-select"
				defaultValue={defaultValue}
				isDeselectable={false}
				options={options}
				onChange={onChange}
			/>
		</ControlContextProvider>
	);
}
