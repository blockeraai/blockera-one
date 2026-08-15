/**
 * Compact in-card gateway row: label + optional toggle + chevron.
 * When enabled, the row opens a nested panel; the toggle does not navigate.
 */

import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { FormToggle } from '@wordpress/components';
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';

import './gateway-card.scss';

export type GatewayRowProps = {
	title: string;
	/** When true, chevron is primary and the row navigates. */
	enabled: boolean;
	toggle?: {
		checked: boolean;
		disabled?: boolean;
		onChange: (next: boolean) => void;
		'aria-label'?: string;
	};
	onOpen?: () => void;
	'data-test'?: string;
	/** Left-side drag handle (hidden until hover). */
	dragHandle?: ReactNode;
	isDragging?: boolean;
};

const IGNORE_ROW_CLICK =
	'.blockera-site-editor-gateway-row__toggle, .blockera-site-editor-gateway-row__drag-handle';

export default function GatewayRow({
	title,
	enabled,
	toggle,
	onOpen,
	'data-test': dataTest,
	dragHandle,
	isDragging,
}: GatewayRowProps) {
	const canOpen = enabled && typeof onOpen === 'function';

	const open = () => {
		if (canOpen) {
			onOpen();
		}
	};

	const onRowClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement | null;
		if (target?.closest(IGNORE_ROW_CLICK)) {
			return;
		}
		open();
	};

	const onRowKeyDown = (event: KeyboardEvent) => {
		if (!canOpen) {
			return;
		}
		const target = event.target as HTMLElement | null;
		if (target?.closest(IGNORE_ROW_CLICK)) {
			return;
		}
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			open();
		}
	};

	return (
		<div
			className={classNames('blockera-site-editor-gateway-row', {
				'is-enabled': enabled,
				'is-navigable': canOpen,
				'has-drag-handle': !!dragHandle,
				'is-dragging': !!isDragging,
			})}
			data-test={dataTest}
			data-enabled={enabled ? 'true' : 'false'}
			onClick={onRowClick}
			onKeyDown={onRowKeyDown}
			role={canOpen ? 'button' : undefined}
			tabIndex={canOpen ? 0 : undefined}
		>
			{dragHandle}
			<span className="blockera-site-editor-gateway-row__label">
				{title}
			</span>
			<span className="blockera-site-editor-gateway-row__trailing">
				{toggle && (
					<span
						className="blockera-site-editor-gateway-row__toggle"
						data-test={dataTest ? `${dataTest}-toggle` : undefined}
						onPointerDown={(event) => {
							// Row is the drag activator; keep toggle clicks
							// from starting a reorder (see RowPointerSensor).
							event.stopPropagation();
						}}
						onClick={(event) => {
							event.stopPropagation();
						}}
						onKeyDown={(event) => {
							event.stopPropagation();
						}}
					>
						<FormToggle
							checked={toggle.checked}
							disabled={toggle.disabled}
							onChange={() => toggle.onChange(!toggle.checked)}
							aria-label={toggle['aria-label'] || title}
						/>
					</span>
				)}
				<span
					className="blockera-site-editor-gateway-row__chevron"
					aria-hidden="true"
				>
					<Icon icon={chevronRight} size={22} />
				</span>
			</span>
		</div>
	);
}
