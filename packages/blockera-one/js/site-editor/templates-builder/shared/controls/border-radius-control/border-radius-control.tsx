/**
 * Border Radius — Blockera BorderRadiusControl.
 *
 * GP BorderRadiusControl is a `blockera-control` only (no BaseControl),
 * so wrap it here for `.blockera-field` like input / toggle rows.
 */

import { useMemo } from '@wordpress/element';

import {
	BaseControl,
	BorderRadiusControl,
	ControlContextProvider,
} from '@blockera/controls';

import { classNames } from '@blockera/classnames';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';
import './border-radius-control.scss';

const EMPTY_RADIUS = {
	type: 'all',
	all: '',
	topLeft: '',
	topRight: '',
	bottomLeft: '',
	bottomRight: '',
};

type BorderRadiusControlRowProps = {
	controlId: string;
	label?: string;
	value: unknown;
	disabled?: boolean;
	attribute?: string;
	blockName?: string;
	columns?: string;
	controlAddonTypes?: string[];
	variableTypes?: string[];
	onChange: (next: unknown) => void;
};

export default function BorderRadiusControlRow({
	controlId,
	label,
	value,
	disabled,
	attribute,
	blockName,
	columns = CONTROL_COLUMNS,
	controlAddonTypes,
	variableTypes,
	onChange,
}: BorderRadiusControlRowProps) {
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: value && typeof value === 'object' ? value : EMPTY_RADIUS,
			attribute,
			blockName,
		}),
		[controlId, value, attribute, blockName]
	);

	const fieldProps = useMemo(
		() => ({
			className: classNames('blockera-templates-builder-border-radius', {
				'is-disabled': disabled,
			}),
			'data-test': 'blockera-templates-builder-border-radius',
		}),
		[disabled]
	);

	return (
		<ControlContextProvider value={contextValue}>
			<BaseControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				fieldProps={fieldProps}
				controlName="border-radius"
			>
				<BorderRadiusControl
					label=""
					defaultValue={EMPTY_RADIUS}
					controlAddonTypes={controlAddonTypes}
					variableTypes={variableTypes}
					onChange={onChange}
				/>
			</BaseControl>
		</ControlContextProvider>
	);
}
