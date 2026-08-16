/**
 * Top (or other side) divider — Blockera BorderControl (width / style / color).
 */

import { useMemo } from '@wordpress/element';

import { classNames } from '@blockera/classnames';
import { BorderControl, ControlContextProvider } from '@blockera/controls';

import { CONTROL_COLUMNS } from '../constants';

type BorderControlRowProps = {
	controlId: string;
	label: string;
	value: unknown;
	disabled?: boolean;
	attribute?: string;
	blockName?: string;
	columns?: string;
	onChange: (next: unknown) => void;
};

const EMPTY_SIDE = {
	width: '',
	style: 'solid',
	color: '',
};

export default function BorderControlRow({
	controlId,
	label,
	value,
	disabled,
	attribute,
	blockName,
	columns = CONTROL_COLUMNS,
	onChange,
}: BorderControlRowProps) {
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: value && typeof value === 'object' ? value : EMPTY_SIDE,
			attribute,
			blockName,
		}),
		[controlId, value, attribute, blockName]
	);

	return (
		<div
			className={classNames('blockera-templates-builder-border', {
				'is-disabled': disabled,
			})}
			data-test="blockera-templates-builder-border"
		>
			<ControlContextProvider value={contextValue}>
				<BorderControl
					label={label}
					columns={columns}
					defaultValue={EMPTY_SIDE}
					controlAddonTypes={['variable']}
					variableTypes={['border']}
					onChange={onChange}
				/>
			</ControlContextProvider>
		</div>
	);
}
