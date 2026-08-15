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
						const tileDisabled = disabled || !!variant.disabled;
						return (
							<button
								key={variant.id}
								type="button"
								disabled={tileDisabled}
								className={classNames(
									'blockera-templates-builder-layout-picker__option',
									{
										'is-selected': isActive,
										'is-coming-soon': !!variant.disabled,
									}
								)}
								aria-pressed={isActive}
								aria-label={
									variant.badge
										? `${variant.label} (${variant.badge})`
										: variant.label
								}
								data-test={`blockera-templates-builder-layout-${variant.id}`}
								onClick={() => {
									if (!tileDisabled) {
										onChange(variant.id);
									}
								}}
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
								{variant.badge ? (
									<span className="blockera-templates-builder-layout-picker__badge">
										{variant.badge}
									</span>
								) : null}
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
