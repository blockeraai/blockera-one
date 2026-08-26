/**
 * Shared dark-sidebar <nav> shell for main navigation and templates purpose-nav.
 * Layout (flex column, 16px section gap) lives in nav-item.scss.
 */

import type { ReactNode } from 'react';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';

/**
 * Internal dependencies
 */
import './nav-item.scss';

export type NavProps = {
	className?: string;
	children: ReactNode;
	'aria-label': string;
	'data-test'?: string;
};

export default function Nav({
	className,
	children,
	'aria-label': ariaLabel,
	'data-test': dataTest,
}: NavProps) {
	return (
		<nav
			className={classNames('blockera-site-editor-nav', className)}
			aria-label={ariaLabel}
			data-test={dataTest}
		>
			{children}
		</nav>
	);
}
