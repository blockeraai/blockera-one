/**
 * Text / background color — Blockera ColorControl with color variables.
 * Empty string is the inspector “None” / reset value.
 */

import { useMemo } from '@wordpress/element';

import { classNames } from '@blockera/classnames';
import { ControlContextProvider, ColorControl } from '@blockera/controls';

type ColorControlRowProps = {
	controlId: string;
	label: string;
	value: unknown;
	disabled?: boolean;
	controlAddonTypes?: string[];
	variableTypes?: string[];
	attribute?: string;
	blockName?: string;
	onChange: (next: unknown) => void;
};

export default function ColorControlRow({
	controlId,
	label,
	value,
	disabled,
	controlAddonTypes,
	variableTypes,
	attribute,
	blockName,
	onChange,
}: ColorControlRowProps) {
	// ControlContextProvider's useSelect deps on this object identity.
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: value ?? '',
			attribute,
			blockName,
		}),
		[controlId, value, attribute, blockName]
	);

	return (
		<div
			className={classNames('blockera-templates-builder-color', {
				'is-disabled': disabled,
			})}
			data-test="blockera-templates-builder-color"
		>
			<ControlContextProvider value={contextValue}>
				<ColorControl
					label={label}
					columns="1.2fr 2fr"
					controlAddonTypes={controlAddonTypes}
					variableTypes={variableTypes}
					defaultValue=""
					onChange={onChange}
				/>
			</ControlContextProvider>
		</div>
	);
}
