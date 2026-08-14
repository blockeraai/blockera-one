/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';

/**
 * Internal dependencies
 */
import type { VariantDef } from '../types';

type SegmentedChoiceProps = {
	label: string;
	value: string | null;
	variants: VariantDef[];
	disabled?: boolean;
	onChange: (variantId: string) => void;
};

export default function SegmentedChoice({
	label,
	value,
	variants,
	disabled,
	onChange,
}: SegmentedChoiceProps) {
	return (
		<div
			className="blockera-templates-builder-segmented"
			data-test="blockera-templates-builder-segmented"
		>
			<div className="blockera-templates-builder-segmented__label">
				{label}
			</div>
			<div className="blockera-templates-builder-segmented__options">
				{variants.map((variant) => {
					const isActive = value === variant.id;
					return (
						<button
							key={variant.id}
							type="button"
							disabled={disabled}
							className={classNames(
								'blockera-templates-builder-segmented__option',
								{ 'is-selected': isActive }
							)}
							aria-pressed={isActive}
							onClick={() => onChange(variant.id)}
						>
							{variant.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
