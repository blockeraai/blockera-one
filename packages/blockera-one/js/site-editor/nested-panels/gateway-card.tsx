/**
 * Gateway card: title + optional toggle + chevron.
 * Compact when there is no body; expanded groups keep body controls below
 * the heading. When enabled, header/chevron opens a nested panel; toggle
 * does not navigate.
 */

import type { ReactNode, KeyboardEvent, MouseEvent } from 'react';

import { FormToggle } from '@wordpress/components';
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { Flex } from '@blockera/controls';

import './gateway-card.scss';

export type GatewayCardProps = {
	title: string;
	/** When true, chevron is primary and header navigates. */
	enabled: boolean;
	/** Optional master toggle in the header. */
	toggle?: {
		checked: boolean;
		disabled?: boolean;
		onChange: (next: boolean) => void;
		'aria-label'?: string;
	};
	/** Open nested panel (only invoked when enabled). */
	onOpen?: () => void;
	className?: string;
	'data-test'?: string;
	children?: ReactNode;
};

export default function GatewayCard({
	title,
	enabled,
	toggle,
	onOpen,
	className,
	'data-test': dataTest,
	children,
}: GatewayCardProps) {
	const canOpen = enabled && typeof onOpen === 'function';
	const hasBody = Boolean(children);

	const open = () => {
		if (canOpen) {
			onOpen();
		}
	};

	const onHeaderClick = (event: MouseEvent) => {
		// Toggle owns its own clicks; don't navigate when interacting with it.
		const target = event.target as HTMLElement | null;
		if (target?.closest('.blockera-site-editor-gateway-card__toggle')) {
			return;
		}
		open();
	};

	const onHeaderKeyDown = (event: KeyboardEvent) => {
		if (!canOpen) {
			return;
		}
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			open();
		}
	};

	return (
		<section
			className={classNames(
				'blockera-se-admin-ui-card',
				'admin-ui-page',
				'blockera-site-editor-gateway-card',
				className,
				{
					'is-header-collapsed': !hasBody,
					'has-body': hasBody,
					'is-enabled': enabled,
					'is-navigable': canOpen,
				}
			)}
			data-test={dataTest}
			data-enabled={enabled ? 'true' : 'false'}
		>
			<div
				className="admin-ui-page__header"
				onClick={onHeaderClick}
				onKeyDown={onHeaderKeyDown}
				role={canOpen ? 'button' : undefined}
				tabIndex={canOpen ? 0 : undefined}
			>
				<Flex
					gap="8px"
					alignItems="center"
					justifyContent="space-between"
					className="admin-ui-page__header-content"
				>
					<h2 className="admin-ui-page__header-title">{title}</h2>
					<span className="blockera-site-editor-gateway-card__trailing">
						{toggle && (
							<span
								className="blockera-site-editor-gateway-card__toggle"
								data-test={
									dataTest ? `${dataTest}-toggle` : undefined
								}
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
									onChange={() =>
										toggle.onChange(!toggle.checked)
									}
									aria-label={toggle['aria-label'] || title}
								/>
							</span>
						)}
						<span
							className="blockera-site-editor-gateway-card__chevron"
							aria-hidden="true"
						>
							<Icon icon={chevronRight} size={22} />
						</span>
					</span>
				</Flex>
			</div>
			{children}
		</section>
	);
}
