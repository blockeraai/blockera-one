/**
 * Shared group card — header row + optional body.
 * Body uses `.admin-ui-page__content.has-padding` (flex column + gap in admin-ui-card.scss).
 */

import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { Flex } from '@blockera/controls';

export type GroupCardProps = {
	title: string;
	children?: ReactNode;
	className?: string;
	headerActions?: ReactNode;
	headerProps?: HTMLAttributes<HTMLDivElement>;
	as?: 'section' | 'div';
	isHeaderCollapsed?: boolean;
	'data-test'?: string;
	'data-enabled'?: string;
};

export default function GroupCard({
	title,
	children,
	className,
	headerActions,
	headerProps,
	as: Tag = 'section',
	isHeaderCollapsed,
	'data-test': dataTest,
	'data-enabled': dataEnabled,
}: GroupCardProps) {
	const hasBody = Boolean(children);

	return (
		<Tag
			className={classNames(
				'blockera-se-admin-ui-card',
				'admin-ui-page',
				className,
				{
					'is-header-collapsed': isHeaderCollapsed ?? !hasBody,
				}
			)}
			data-test={dataTest}
			data-enabled={dataEnabled}
		>
			<div className="admin-ui-page__header" {...headerProps}>
				<Flex
					gap="8px"
					alignItems="center"
					justifyContent="space-between"
					className="admin-ui-page__header-content"
				>
					<h2 className="admin-ui-page__header-title">{title}</h2>
					{headerActions}
				</Flex>
			</div>
			{hasBody ? (
				<div className="admin-ui-page__content has-padding">
					{children}
				</div>
			) : null}
		</Tag>
	);
}
