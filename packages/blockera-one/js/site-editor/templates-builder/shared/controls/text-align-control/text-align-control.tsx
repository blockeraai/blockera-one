/**
 * Text Align — Blockera TextAlignControl.
 */

import { useMemo } from '@wordpress/element';

import { classNames } from '@blockera/classnames';
import { ControlContextProvider, TextAlignControl } from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';

const FIELD_PROPS = {
	className: 'blockera-templates-builder-text-align',
	'data-test': 'blockera-templates-builder-text-align',
};

type TextAlignControlRowProps = {
	controlId: string;
	label?: string;
	value: unknown;
	disabled?: boolean;
	attribute?: string;
	blockName?: string;
	columns?: string;
	onChange: (next: unknown) => void;
};

export default function TextAlignControlRow({
	controlId,
	label,
	value,
	disabled,
	attribute,
	blockName,
	columns = CONTROL_COLUMNS,
	onChange,
}: TextAlignControlRowProps) {
	const resolvedValue = typeof value === 'string' ? value : '';

	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: resolvedValue,
			attribute,
			blockName,
		}),
		[controlId, resolvedValue, attribute, blockName]
	);

	return (
		<ControlContextProvider value={contextValue}>
			<TextAlignControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				fieldProps={{
					...FIELD_PROPS,
					className: classNames(FIELD_PROPS.className, {
						'is-disabled': disabled,
					}),
				}}
				defaultValue=""
				disabled={disabled}
				onChange={onChange}
			/>
		</ControlContextProvider>
	);
}
