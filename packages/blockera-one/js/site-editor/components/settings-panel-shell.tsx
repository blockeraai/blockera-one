/**
 * Shared Admin UI card shell for sidebar settings panels
 * (Site Identity, Homepage Settings, Performance, …).
 * Header row (title + PoweredByOne mark) + padded content area.
 * Chrome: GroupCard → admin-ui-card.scss.
 */

import type { ReactNode } from 'react';

/**
 * Blockera dependencies
 */
import { PoweredByOne } from '@blockera/controls';

/**
 * Internal dependencies
 */
import GroupCard from './group-card';

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
		<GroupCard
			as="div"
			title={title}
			className={className}
			data-test={dataTest}
			headerActions={
				<span className="admin-ui-page__header-visual">
					{headerVisual ?? <PoweredByOne />}
				</span>
			}
		>
			{children}
		</GroupCard>
	);
}
