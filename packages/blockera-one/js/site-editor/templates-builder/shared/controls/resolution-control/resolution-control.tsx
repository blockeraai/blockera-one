/**
 * Image resolution (sizeSlug) — Blockera ResolutionControl.
 * Live options are resolved inside the control from block-editor `imageSizes`.
 */

import { useMemo } from '@wordpress/element';

import {
	ControlContextProvider,
	DEFAULT_RESOLUTION_VALUE,
	ResolutionControl,
} from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';

const FIELD_PROPS = {
	className: 'blockera-templates-builder-resolution',
	'data-test': 'blockera-templates-builder-resolution',
};

type ResolutionControlRowProps = {
	controlId: string;
	label?: string;
	value: unknown;
	disabled?: boolean;
	defaultValue?: string;
	columns?: string;
	onChange: (next: string) => void;
};

export default function ResolutionControlRow({
	controlId,
	label,
	value,
	disabled,
	defaultValue = DEFAULT_RESOLUTION_VALUE,
	columns = CONTROL_COLUMNS,
	onChange,
}: ResolutionControlRowProps) {
	const resolvedValue =
		typeof value === 'string' && value !== '' ? value : defaultValue;

	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: resolvedValue,
		}),
		[controlId, resolvedValue]
	);

	return (
		<ControlContextProvider value={contextValue}>
			<ResolutionControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				defaultValue={defaultValue}
				disabled={disabled}
				fieldProps={FIELD_PROPS}
				onChange={onChange}
			/>
		</ControlContextProvider>
	);
}
