import { FormToggle } from '@wordpress/components';

import { classNames } from '@blockera/classnames';
import { BaseControl } from '@blockera/controls';

import { fieldColumns } from '../constants';
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
	columns = '30px auto',
	onChange,
	className,
}: ToggleControlProps) {
	return (
		<BaseControl
			label={label ?? ''}
			columns={fieldColumns(label, columns)}
			fieldProps={{
				className: classNames(
					'blockera-templates-builder-toggle',
					className
				),
				'data-test': 'blockera-templates-builder-toggle',
			}}
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
