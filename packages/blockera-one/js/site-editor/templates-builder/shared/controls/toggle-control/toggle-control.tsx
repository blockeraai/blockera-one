import { FormToggle } from '@wordpress/components';

import { BaseControl } from '@blockera/controls';

import { CONTROL_COLUMNS } from '../constants';
import './toggle-control.scss';

type ToggleControlProps = {
	label: string;
	checked: boolean;
	disabled?: boolean;
	columns?: string;
	onChange: (next: boolean) => void;
};

export default function ToggleControlRow({
	label,
	checked,
	disabled,
	columns = CONTROL_COLUMNS,
	onChange,
}: ToggleControlProps) {
	return (
		<div
			className="blockera-templates-builder-toggle"
			data-test="blockera-templates-builder-toggle"
		>
			<BaseControl label={label} columns={columns} controlName="toggle">
				<FormToggle
					checked={checked}
					disabled={disabled}
					onChange={() => onChange(!checked)}
				/>
			</BaseControl>
		</div>
	);
}
