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

import useToggleNudge from './use-toggle-nudge';
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
	const canNudge = !!toggle && !enabled && !toggle.disabled;
	const hasBody = Boolean(children);
	const { isNudging, nudge, onNudgeAnimationEnd } = useToggleNudge();

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
		if (canOpen) {
			open();
			return;
		}
		if (canNudge) {
			nudge();
		}
	};

	const onHeaderKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}
		if (canOpen) {
			event.preventDefault();
			open();
			return;
		}
		if (canNudge) {
			event.preventDefault();
			nudge();
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
								className={classNames(
									'blockera-site-editor-gateway-card__toggle',
									{ 'is-nudging': isNudging }
								)}
								data-test={
									dataTest ? `${dataTest}-toggle` : undefined
								}
								data-nudging={isNudging ? 'true' : 'false'}
								onAnimationEnd={onNudgeAnimationEnd}
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
