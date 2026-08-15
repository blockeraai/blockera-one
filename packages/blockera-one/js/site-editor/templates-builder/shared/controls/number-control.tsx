import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type NumberControlProps = {
	label: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	labelDescription?: string;
	onChange: (next: number) => void;
};

export default function NumberControlRow({
	label,
	value,
	min = 1,
	max = 50,
	step = 1,
	disabled,
	labelDescription,
	onChange,
}: NumberControlProps) {
	const inputId = useId();

	return (
		<div
			className="blockera-templates-builder-number"
			data-test="blockera-templates-builder-number"
		>
			<label
				className="blockera-templates-builder-number__label"
				htmlFor={inputId}
			>
				{label}
			</label>
			<div className="blockera-templates-builder-number__input-wrap">
				<button
					type="button"
					className="blockera-templates-builder-number__btn"
					disabled={disabled || value <= min}
					aria-label={__('Decrease', 'blockera')}
					onClick={() => onChange(Math.max(min, value - step))}
				>
					−
				</button>
				<input
					id={inputId}
					type="number"
					className="blockera-templates-builder-number__input"
					value={value}
					min={min}
					max={max}
					step={step}
					disabled={disabled}
					onChange={(event) => {
						const next = parseInt(event.target.value, 10);
						if (Number.isNaN(next)) {
							return;
						}
						const clamped = Math.min(max, Math.max(min, next));
						onChange(clamped);
					}}
				/>
				<button
					type="button"
					className="blockera-templates-builder-number__btn"
					disabled={disabled || value >= max}
					aria-label={__('Increase', 'blockera')}
					onClick={() => onChange(Math.min(max, value + step))}
				>
					+
				</button>
			</div>
			{labelDescription ? (
				<p className="blockera-templates-builder-number__description">
					{labelDescription}
				</p>
			) : null}
		</div>
	);
}
