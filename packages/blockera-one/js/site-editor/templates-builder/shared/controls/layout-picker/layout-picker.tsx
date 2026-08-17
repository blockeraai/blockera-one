/**
 * Visual thumbnail layout picker (Blocksy-style image picker).
 */

import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { BaseControl } from '@blockera/controls';

/**
 * Internal dependencies
 */
import { CONTROL_COLUMNS_1, fieldColumns } from '../constants';
import type { VariantDef } from '../../types';
import './layout-picker.scss';

type LayoutPickerProps = {
	label?: string;
	value: string | null;
	variants: VariantDef[];
	disabled?: boolean;
	columns?: string;
	onChange: (variantId: string) => void;
	missing?: boolean;
	onAddBack?: () => void;
};

export default function LayoutPicker({
	label,
	value,
	variants,
	disabled,
	columns = CONTROL_COLUMNS_1,
	onChange,
	missing,
	onAddBack,
}: LayoutPickerProps) {
	return (
		<div
			className="blockera-templates-builder-layout-picker"
			data-test="blockera-templates-builder-layout-picker"
		>
			<BaseControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				controlName="layout-picker"
			>
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
								<div
									key={variant.id}
									role="button"
									tabIndex={tileDisabled ? -1 : 0}
									aria-disabled={tileDisabled}
									className={classNames(
										'blockera-templates-builder-layout-picker__option',
										{
											'is-selected': isActive,
											'is-coming-soon':
												!!variant.disabled,
											'is-disabled': tileDisabled,
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
									onKeyDown={(event) => {
										if (tileDisabled) {
											return;
										}

										if (
											event.key === 'Enter' ||
											event.key === ' '
										) {
											event.preventDefault();
											onChange(variant.id);
										}
									}}
								>
									<span className="blockera-templates-builder-layout-picker__preview">
										{variant.thumbnail ? (
											<img
												src={variant.thumbnail}
												alt=""
												width={72}
												height={56}
											/>
										) : (
											<span className="blockera-templates-builder-layout-picker__fallback" />
										)}
										{variant.badge ? (
											<span className="blockera-templates-builder-layout-picker__badge">
												{variant.badge}
											</span>
										) : null}
									</span>
									{/* Visible name; option aria-label already exposes it. */}
									<span
										className="blockera-templates-builder-layout-picker__caption"
										aria-hidden="true"
									>
										{variant.label}
									</span>
								</div>
							);
						})}
					</div>
				)}
				{value === null && !missing && (
					<p className="blockera-templates-builder-custom-hint">
						{__('Custom layout', 'blockera')}
					</p>
				)}
			</BaseControl>
		</div>
	);
}
