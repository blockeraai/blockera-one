/**
 * Shared dark-sidebar navigation row used by the Site Editor main navigation
 * (Design / Site / Features / Resources) and the Templates purpose-nav.
 * One source of truth for row markup, hover/active chrome, counts and
 * trailing icons.
 */

import type { ReactNode } from 'react';

import { Button } from '@wordpress/components';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { Flex } from '@blockera/controls';
import { Icon } from '@blockera/icons';

/**
 * Internal dependencies
 */
import './nav-item.scss';

export type NavItemIcon = {
	library: 'wp' | 'ui' | 'blockera';
	icon: string;
	/** Icon size in px (default 24). */
	size?: number;
};

export type NavItemProps = {
	label: string;
	icon: NavItemIcon;
	isActive?: boolean;
	onClick?: () => void;
	/** When set, renders an external link opening in a new tab. */
	href?: string;
	/** Trailing count for browse/list destinations (hidden when null). */
	count?: number | null;
	/** Trailing chevron (default true). External links show a new-tab icon. */
	showChevron?: boolean;
	/** Nesting level: 1 = child row, 2 = grandchild row. */
	indent?: 0 | 1 | 2;
	/**
	 * Absolutely-positioned trailing badge (e.g. template status). Rendered
	 * as a sibling of the button because WP Button wraps its children in a
	 * Tooltip context, which turns nested tooltips into no-ops.
	 */
	badge?: ReactNode;
	'data-test'?: string;
};

export default function NavItem({
	label,
	icon,
	isActive = false,
	onClick,
	href,
	count = null,
	showChevron = true,
	indent = 0,
	badge = null,
	'data-test': dataTest,
}: NavItemProps) {
	const external = !!href;

	let trailingGlyph = null;
	if (external) {
		trailingGlyph = (
			<Icon library="ui" icon="arrow-new-tab" iconSize={22} />
		);
	} else if (showChevron) {
		trailingGlyph = (
			<Icon library="wp" icon="chevron-right" iconSize={20} />
		);
	}

	// Shared wrapper so nav-item.scss hover/focus motion hits both the
	// chevron and the external new-tab glyph.
	const trailingIcon = trailingGlyph ? (
		<span
			className="blockera-site-editor-nav__item-chevron"
			aria-hidden="true"
		>
			{trailingGlyph}
		</span>
	) : null;

	const showCount = typeof count === 'number';

	// `is-child` / `is-grandchild` mirror the indent level on the button so
	// styling and e2e assertions can target nested rows directly.
	const buttonClassName = classNames('blockera-site-editor-nav__item', {
		'is-active': isActive,
		'is-child': indent > 0,
		'is-grandchild': indent === 2,
		'is-external': external,
	});

	const shellClassName = classNames(
		'blockera-site-editor-nav__item-shell',
		indent > 0 && `is-indent-${indent}`
	);

	return (
		<div className={shellClassName}>
			<Button
				className={buttonClassName}
				onClick={external ? undefined : onClick}
				href={href}
				target={external ? '_blank' : undefined}
				rel={external ? 'noopener noreferrer' : undefined}
				data-test={dataTest}
				aria-current={isActive ? 'page' : undefined}
			>
				<Flex
					alignItems="center"
					justifyContent="space-between"
					className="blockera-site-editor-nav__item-inner"
				>
					<Flex
						alignItems="center"
						justifyContent="flex-start"
						gap="8px"
						className="blockera-site-editor-nav__item-label"
					>
						<span className="blockera-site-editor-nav__item-icon">
							<Icon
								library={icon.library}
								icon={icon.icon}
								iconSize={icon.size ?? 24}
							/>
						</span>
						<span>{label}</span>
					</Flex>
					<Flex
						alignItems="center"
						gap="6px"
						className="blockera-site-editor-nav__item-suffix"
					>
						{showCount ? (
							<span className="blockera-site-editor-nav__count">
								{count}
							</span>
						) : null}
						{trailingIcon}
					</Flex>
				</Flex>
			</Button>
			{badge ? (
				<span className="blockera-site-editor-nav__badge-slot">
					{badge}
				</span>
			) : null}
		</div>
	);
}
