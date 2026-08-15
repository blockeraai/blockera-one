/**
 * Items Spacing (and similar) — Blockera InputControl with units + variables.
 * Omit `unitType` for plain text (e.g. breadcrumbs separator).
 */

import { useMemo } from '@wordpress/element';

import { ControlContextProvider, InputControl } from '@blockera/controls';

import { CONTROL_COLUMNS } from './constants';

type InputControlRowProps = {
	controlId: string;
	label: string;
	value: unknown;
	disabled?: boolean;
	unitType?: string;
	controlAddonTypes?: string[];
	variableTypes?: string[];
	min?: number;
	attribute?: string;
	blockName?: string;
	defaultValue?: string | number | boolean;
	onChange: (next: unknown) => void;
};

export default function InputControlRow({
	controlId,
	label,
	value,
	disabled,
	unitType = '',
	controlAddonTypes,
	variableTypes,
	min,
	attribute,
	blockName,
	defaultValue = '',
	onChange,
}: InputControlRowProps) {
	const hasUnits = !!unitType;
	// Plain text must allow empty: InputControl treats '' as empty and
	// substitutes defaultValue, which would snap Separator back to '/'.
	const inputDefaultValue = hasUnits ? defaultValue : '';
	// ControlContextProvider's useSelect deps on this object identity.
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value,
			attribute,
			blockName,
		}),
		[controlId, value, attribute, blockName]
	);

	return (
		<div
			className="blockera-templates-builder-input"
			data-test="blockera-templates-builder-input"
		>
			<ControlContextProvider value={contextValue}>
				<InputControl
					label={label}
					columns={CONTROL_COLUMNS}
					unitType={unitType}
					controlAddonTypes={controlAddonTypes}
					variableTypes={variableTypes}
					min={min}
					defaultValue={inputDefaultValue}
					disabled={disabled}
					type={hasUnits ? undefined : 'text'}
					arrows={hasUnits}
					onChange={onChange}
				/>
			</ControlContextProvider>
		</div>
	);
}
