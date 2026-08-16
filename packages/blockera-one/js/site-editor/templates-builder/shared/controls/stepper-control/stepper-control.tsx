/**
 * Discrete count — Blockera StepperControl (− / value / +).
 */

import { useCallback, useMemo } from '@wordpress/element';

import { classNames } from '@blockera/classnames';
import { ControlContextProvider, StepperControl } from '@blockera/controls';

import { CONTROL_COLUMNS } from '../constants';

type StepperControlRowProps = {
	controlId: string;
	label: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	labelDescription?: string;
	attribute?: string;
	blockName?: string;
	defaultValue?: number;
	columns?: string;
	onChange: (next: number) => void;
};

export default function StepperControlRow({
	controlId,
	label,
	value,
	min,
	max,
	step,
	disabled,
	labelDescription,
	attribute,
	blockName,
	defaultValue = 0,
	columns = CONTROL_COLUMNS,
	onChange,
}: StepperControlRowProps) {
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
	const handleChange = useCallback(
		(next: number | string) => {
			if (typeof next === 'number') {
				onChange(next);
			}
		},
		[onChange]
	);

	return (
		<div
			className={classNames('blockera-templates-builder-stepper', {
				'is-disabled': disabled,
			})}
			data-test="blockera-templates-builder-stepper"
		>
			<ControlContextProvider value={contextValue}>
				<StepperControl
					label={label}
					columns={columns}
					min={min}
					max={max}
					step={step}
					defaultValue={defaultValue}
					disabled={disabled}
					labelDescription={labelDescription}
					onChange={handleChange}
				/>
			</ControlContextProvider>
		</div>
	);
}
