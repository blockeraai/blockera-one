/**
 * Icon picker — Blockera IconControl.
 */

import { useMemo } from '@wordpress/element';

import { classNames } from '@blockera/classnames';
import { ControlContextProvider, IconControl } from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';
import { EMPTY_ICON_VALUE, isEmptyIconValue } from '../../ops/meta';

type IconControlRowProps = {
	controlId: string;
	label?: string;
	value: unknown;
	disabled?: boolean;
	columns?: string;
	onChange: (next: unknown) => void;
};

export default function IconControlRow({
	controlId,
	label,
	value,
	disabled,
	columns = CONTROL_COLUMNS,
	onChange,
}: IconControlRowProps) {
	const emptyIcon = useMemo(() => ({ ...EMPTY_ICON_VALUE }), []);
	const resolved = useMemo(() => {
		if (
			value &&
			typeof value === 'object' &&
			!Array.isArray(value) &&
			!isEmptyIconValue(value)
		) {
			return value;
		}
		return emptyIcon;
	}, [emptyIcon, value]);
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: resolved,
		}),
		[controlId, resolved]
	);
	const fieldProps = useMemo(
		() => ({
			className: classNames('blockera-templates-builder-icon', {
				'is-disabled': disabled,
			}),
			'data-test': 'blockera-templates-builder-icon',
		}),
		[disabled]
	);

	return (
		<ControlContextProvider value={contextValue}>
			<IconControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				fieldProps={fieldProps}
				defaultValue={emptyIcon}
				onChange={onChange}
			/>
		</ControlContextProvider>
	);
}
