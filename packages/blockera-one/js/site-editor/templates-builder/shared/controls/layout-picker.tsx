/**
 * Visual thumbnail layout picker (Blocksy-style image picker).
 */

import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';

/**
 * Internal dependencies
 */
import type { VariantDef } from '../types';

type LayoutPickerProps = {
	label: string;
	value: string | null;
	variants: VariantDef[];
	disabled?: boolean;
	onChange: (variantId: string) => void;
	missing?: boolean;
	onAddBack?: () => void;
};

export default function LayoutPicker({
	label,
	value,
	variants,
	disabled,
	onChange,
	missing,
	onAddBack,
}: LayoutPickerProps) {
	return (
		<div
			className="blockera-templates-builder-layout-picker"
			data-test="blockera-templates-builder-layout-picker"
		>
			<div className="blockera-templates-builder-layout-picker__label">
				{label}
			</div>
			{missing ? (
				<div className="blockera-templates-builder-missing">
					<span>
						{__(
							'This section was removed from the template.',
							'blockera'
						)}
					</span>
					{onAddBack && (
						<button
							type="button"
							className="blockera-templates-builder-missing__action"
							onClick={onAddBack}
						>
							{__('Add it back', 'blockera')}
						</button>
					)}
				</div>
			) : (
				<div className="blockera-templates-builder-layout-picker__grid">
					{variants.map((variant) => {
						const isActive = value === variant.id;
						return (
							<button
								key={variant.id}
								type="button"
								disabled={disabled}
								className={classNames(
									'blockera-templates-builder-layout-picker__option',
									{ 'is-selected': isActive }
								)}
								aria-pressed={isActive}
								aria-label={variant.label}
								data-test={`blockera-templates-builder-layout-${variant.id}`}
								onClick={() => onChange(variant.id)}
							>
								{variant.thumbnail ? (
									<img
										src={variant.thumbnail}
										alt=""
										width={72}
										height={56}
									/>
								) : (
									<span className="blockera-templates-builder-layout-picker__fallback">
										{variant.label}
									</span>
								)}
							</button>
						);
					})}
				</div>
			)}
			{value === null && !missing && (
				<p className="blockera-templates-builder-custom-hint">
					{__('Custom layout', 'blockera')}
				</p>
			)}
		</div>
	);
}
