/**
 * Top/Bottom (and similar) — Blockera ToggleSelectControl.
 */

import {
	ControlContextProvider,
	ToggleSelectControl,
} from '@blockera/controls';

import type { VariantDef } from '../types';

type ToggleSelectRowProps = {
	controlId: string;
	label: string;
	value: string | null;
	variants: VariantDef[];
	disabled?: boolean;
	defaultValue?: string;
	onChange: (next: string) => void;
};

export default function ToggleSelectRow({
	controlId,
	label,
	value,
	variants,
	disabled,
	defaultValue = '',
	onChange,
}: ToggleSelectRowProps) {
	return (
		<div
			className="blockera-templates-builder-toggle-select"
			data-test="blockera-templates-builder-toggle-select"
		>
			<ControlContextProvider
				value={{
					name: `templates-builder-${controlId}`,
					value: value ?? defaultValue,
				}}
			>
				<ToggleSelectControl
					label={label}
					columns="1.2fr 2fr"
					defaultValue={defaultValue}
					isDeselectable={false}
					options={variants.map((variant) => ({
						label: variant.label,
						value: variant.id,
						disabled,
					}))}
					onChange={(next: string) => onChange(next)}
				/>
			</ControlContextProvider>
		</div>
	);
}
