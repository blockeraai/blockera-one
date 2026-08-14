import { FormToggle } from '@wordpress/components';

type ToggleControlProps = {
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (next: boolean) => void;
};

export default function ToggleControlRow({
	label,
	checked,
	disabled,
	onChange,
}: ToggleControlProps) {
	return (
		<div
			className="blockera-templates-builder-toggle"
			data-test="blockera-templates-builder-toggle"
		>
			<span className="blockera-templates-builder-toggle__label">
				{label}
			</span>
			<FormToggle
				checked={checked}
				disabled={disabled}
				onChange={() => onChange(!checked)}
			/>
		</div>
	);
}
