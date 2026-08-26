/**
 * Visual thumbnail layout picker (Blocksy-style image picker).
 */

import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { BaseControl, ChangeIndicator, Tooltip } from '@blockera/controls';

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
	className?: string;
	editedVariantIds?: string[];
};

const EMPTY_EDITED_VARIANT_IDS: string[] = [];

export default function LayoutPicker({
	label,
	value,
	variants,
	disabled,
	columns = CONTROL_COLUMNS_1,
	onChange,
	missing,
	onAddBack,
	className,
	editedVariantIds = EMPTY_EDITED_VARIANT_IDS,
}: LayoutPickerProps) {
	return (
		<BaseControl
			label={label ?? ''}
			columns={fieldColumns(label, columns)}
			fieldProps={{
				className: classNames(
					'blockera-templates-builder-layout-picker',
					className
				),
				'data-test': 'blockera-templates-builder-layout-picker',
			}}
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
						const hasEdits =
							editedVariantIds.indexOf(variant.id) !== -1;
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
										'is-coming-soon': !!variant.disabled,
										'is-disabled': tileDisabled,
										'has-session-edits': hasEdits,
									}
								)}
								aria-pressed={isActive}
								aria-label={
									variant.badge
										? `${variant.label} (${variant.badge})`
										: variant.label
								}
								data-test={`blockera-templates-builder-layout-${variant.id}`}
								data-session-edits={
									hasEdits ? 'true' : undefined
								}
								onClick={() => {
									if (!tileDisabled && !isActive) {
										onChange(variant.id);
									}
								}}
								onKeyDown={(event) => {
									if (tileDisabled || isActive) {
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
									{hasEdits ? (
										<Tooltip
											text={__(
												'You edited this design during current session.',
												'blockera'
											)}
											delay={200}
											hideOnClick={false}
											placement="top"
										>
											<span className="blockera-templates-builder-layout-picker__edits">
												<ChangeIndicator
													isChanged
													isAnimated={false}
													data-test={`blockera-templates-builder-layout-edits-${variant.id}`}
													size={6}
													primaryColor={
														'var(--blockera-controls-primary-color, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)))'
													}
													outlineSize={2}
												/>
											</span>
										</Tooltip>
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
	);
}
