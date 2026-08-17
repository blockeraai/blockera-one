import { FormToggle } from '@wordpress/components';

import { classNames } from '@blockera/classnames';
import { BaseControl } from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';
import './toggle-control.scss';

type ToggleControlProps = {
	label?: string;
	checked: boolean;
	disabled?: boolean;
	columns?: string;
	onChange: (next: boolean) => void;
	className?: string;
};

export default function ToggleControlRow({
	label,
	checked,
	disabled,
	columns = CONTROL_COLUMNS,
	onChange,
	className,
}: ToggleControlProps) {
	return (
		<BaseControl
			label={label ?? ''}
			columns={fieldColumns(label, columns)}
			className={classNames(
				'blockera-templates-builder-toggle',
				className
			)}
			data-test="blockera-templates-builder-toggle"
			controlName="toggle"
		>
			<FormToggle
				checked={checked}
				disabled={disabled}
				onChange={() => onChange(!checked)}
			/>
		</BaseControl>
	);
}
