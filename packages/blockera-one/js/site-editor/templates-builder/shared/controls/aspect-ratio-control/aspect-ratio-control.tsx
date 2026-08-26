/**
 * Aspect Ratio — Blockera AspectRatioControl.
 */

import { useMemo } from '@wordpress/element';

import {
	AspectRatioControl,
	ControlContextProvider,
	DEFAULT_ASPECT_RATIO_VALUE,
} from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';

const FIELD_PROPS = {
	className: 'blockera-templates-builder-aspect-ratio',
	'data-test': 'blockera-templates-builder-aspect-ratio',
};

type AspectRatioControlRowProps = {
	controlId: string;
	label?: string;
	value: unknown;
	disabled?: boolean;
	attribute?: string;
	blockName?: string;
	columns?: string;
	onChange: (next: unknown) => void;
};

export default function AspectRatioControlRow({
	controlId,
	label,
	value,
	disabled,
	attribute,
	blockName,
	columns = CONTROL_COLUMNS,
	onChange,
}: AspectRatioControlRowProps) {
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value:
				value && typeof value === 'object'
					? value
					: DEFAULT_ASPECT_RATIO_VALUE,
			attribute,
			blockName,
		}),
		[controlId, value, attribute, blockName]
	);

	return (
		<ControlContextProvider value={contextValue}>
			<AspectRatioControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				fieldProps={FIELD_PROPS}
				defaultValue={DEFAULT_ASPECT_RATIO_VALUE}
				disabled={disabled}
				onChange={onChange}
			/>
		</ControlContextProvider>
	);
}
