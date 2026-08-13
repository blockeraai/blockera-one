/**
 * Shared Admin UI card shell for sidebar settings panels
 * (Site Identity, Homepage Settings, Performance, …).
 * Header row (title + PoweredByOne mark) + padded content area.
 * Chrome comes from admin-ui-card.scss.
 */

import type { ReactNode } from 'react';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { Flex, PoweredByOne } from '@blockera/controls';

export type SettingsPanelShellProps = {
	title: string;
	/** Extra classes on the card root (panel-specific overrides). */
	className?: string;
	/** Header trailing visual; defaults to the PoweredByOne mark. */
	headerVisual?: ReactNode;
	children: ReactNode;
	'data-test'?: string;
};

export default function SettingsPanelShell({
	title,
	className,
	headerVisual,
	children,
	'data-test': dataTest,
}: SettingsPanelShellProps) {
	return (
		<div
			className={classNames(
				'blockera-se-admin-ui-card',
				'admin-ui-page',
				className
			)}
			data-test={dataTest}
		>
			<div className="admin-ui-page__header">
				<Flex
					gap="8px"
					alignItems="center"
					justifyContent="space-between"
					className="admin-ui-page__header-content"
				>
					<h2 className="admin-ui-page__header-title">{title}</h2>
					<span className="admin-ui-page__header-visual">
						{headerVisual ?? <PoweredByOne />}
					</span>
				</Flex>
			</div>
			<div className="admin-ui-page__content has-padding">{children}</div>
		</div>
	);
}
