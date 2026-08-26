/**
 * Font Family — Blockera FontFamilyControl with font-family variables.
 */

import { useMemo } from '@wordpress/element';

import { classNames } from '@blockera/classnames';
import { ControlContextProvider, FontFamilyControl } from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';

const FIELD_PROPS = {
	className: 'blockera-templates-builder-font-family',
	'data-test': 'blockera-templates-builder-font-family',
};

type FontFamilyControlRowProps = {
	controlId: string;
	label?: string;
	value: unknown;
	disabled?: boolean;
	controlAddonTypes?: string[];
	variableTypes?: string[];
	attribute?: string;
	blockName?: string;
	columns?: string;
	onChange: (next: unknown) => void;
};

export default function FontFamilyControlRow({
	controlId,
	label,
	value,
	disabled,
	controlAddonTypes,
	variableTypes,
	attribute,
	blockName,
	columns = CONTROL_COLUMNS,
	onChange,
}: FontFamilyControlRowProps) {
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
		<ControlContextProvider value={contextValue}>
			<FontFamilyControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				fieldProps={{
					...FIELD_PROPS,
					className: classNames(FIELD_PROPS.className, {
						'is-disabled': disabled,
					}),
				}}
				controlAddonTypes={controlAddonTypes}
				variableTypes={variableTypes}
				defaultValue=""
				disabled={disabled}
				onChange={onChange}
			/>
		</ControlContextProvider>
	);
}
