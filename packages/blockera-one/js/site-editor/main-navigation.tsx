/**
 * Custom Design / Site / Resources navigation for the Site Editor main sidebar.
 */

import type { ReactNode } from 'react';

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { Flex } from '@blockera/controls';
import { Icon } from '@blockera/icons';

/**
 * Internal dependencies
 */
import {
	COMPONENT_SELECTOR,
	RESOURCE_LINKS,
	ROUTES,
	type DesignNavKey,
	type FeaturesNavKey,
	type MainNavKey,
	type SiteNavKey,
} from './constants';
import './main-navigation.scss';
import {
	clearCoreSidebarSlideClasses,
	getActiveMainNavKey,
	navigateToSiteEditorPath,
	navigateViaCoreUid,
} from './utils';

type NavItemProps = {
	label: string;
	icon: string;
	iconLibrary?: 'wp' | 'ui';
	isActive?: boolean;
	onClick?: () => void;
	href?: string;
	external?: boolean;
	/** False for items that stay on Design-root (Styles). */
	showChevron?: boolean;
	'data-test'?: string;
};

function NavItem({
	label,
	icon,
	iconLibrary = 'wp',
	isActive = false,
	onClick,
	href,
	external = false,
	showChevron = true,
	'data-test': dataTest,
}: NavItemProps) {
	const className = [
		'blockera-site-editor-main-navigation__item',
		isActive ? 'is-active' : '',
	]
		.filter(Boolean)
		.join(' ');

	let trailingIcon = null;
	if (external) {
		trailingIcon = <Icon library="ui" icon="arrow-new-tab" iconSize={18} />;
	} else if (showChevron) {
		trailingIcon = <Icon library="wp" icon="chevron-right" iconSize={18} />;
	}

	const content = (
		<Flex
			alignItems="center"
			justifyContent="space-between"
			className="blockera-site-editor-main-navigation__item-inner"
		>
			<Flex
				alignItems="center"
				justifyContent="flex-start"
				gap="10px"
				className="blockera-site-editor-main-navigation__item-label"
			>
				<span className="blockera-site-editor-main-navigation__item-icon">
					<Icon library={iconLibrary} icon={icon} iconSize={22} />
				</span>
				<span>{label}</span>
			</Flex>
			{trailingIcon ? (
				<span className="blockera-site-editor-main-navigation__item-suffix">
					{trailingIcon}
				</span>
			) : null}
		</Flex>
	);

	if (external && href) {
		return (
			<a
				className={className}
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				data-test={dataTest}
			>
				{content}
			</a>
		);
	}

	return (
		<button
			type="button"
			className={className}
			onClick={onClick}
			data-test={dataTest}
			aria-current={isActive ? 'page' : undefined}
		>
			{content}
		</button>
	);
}

function NavCategory({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<div className="blockera-site-editor-main-navigation__category">
			<h2 className="blockera-site-editor-main-navigation__category-title">
				{title}
			</h2>
			<div className="blockera-site-editor-main-navigation__category-items">
				{children}
			</div>
		</div>
	);
}

const DESIGN_ITEMS: Array<{
	key: DesignNavKey;
	label: string;
	icon: string;
	coreUidKey: DesignNavKey;
	showChevron?: boolean;
}> = [
	{
		key: 'styles',
		label: __('Styles', 'blockera'),
		icon: 'styles',
		coreUidKey: 'styles',
		showChevron: false,
	},
	{
		key: 'navigation',
		label: __('Navigation', 'blockera'),
		icon: 'navigation',
		coreUidKey: 'navigation',
	},
	{
		key: 'pages',
		label: __('Pages', 'blockera'),
		icon: 'page',
		coreUidKey: 'pages',
	},
	{
		key: 'templates',
		label: __('Templates', 'blockera'),
		icon: 'layout',
		coreUidKey: 'templates',
	},
	{
		key: 'patterns',
		label: __('Patterns', 'blockera'),
		icon: 'symbol',
		coreUidKey: 'patterns',
	},
];

const SITE_ITEMS: Array<{
	key: SiteNavKey;
	label: string;
	icon: string;
}> = [
	{
		key: 'identity',
		label: __('Site Identity', 'blockera'),
		icon: 'site-logo',
	},
	{
		key: 'homepage',
		label: __('Homepage Settings', 'blockera'),
		icon: 'home',
	},
];

const FEATURES_ITEMS: Array<{
	key: FeaturesNavKey;
	label: string;
	icon: string;
	iconLibrary?: 'wp' | 'ui';
}> = [
	{
		key: 'performance',
		label: __('Performance', 'blockera'),
		icon: 'zap-fast-flat',
		iconLibrary: 'ui',
	},
];

export default function MainNavigation() {
	const [activeKey, setActiveKey] = useState<MainNavKey | null>(() =>
		getActiveMainNavKey()
	);

	useEffect(() => {
		const sync = () => setActiveKey(getActiveMainNavKey());

		sync();
		window.addEventListener('popstate', sync);

		return () => {
			window.removeEventListener('popstate', sync);
		};
	}, []);

	// No enter animation on the main list — strip stale core slide classes
	// (SidebarNavigationContext) that can linger after Patterns / our drill-downs.
	useEffect(() => {
		clearCoreSidebarSlideClasses();
		const id = window.requestAnimationFrame(() => {
			clearCoreSidebarSlideClasses();
		});
		return () => window.cancelAnimationFrame(id);
	}, []);

	const onDesignClick = (key: DesignNavKey) => {
		navigateViaCoreUid(key);
		setActiveKey(key);
	};

	const onSiteClick = (key: SiteNavKey) => {
		const path = key === 'identity' ? ROUTES.identity : ROUTES.homepage;
		// Core may not expose Identity uid/route — navigate via `p` like homepage.
		navigateToSiteEditorPath(path, { direction: 'forward' });
		setActiveKey(key);
	};

	const onFeaturesClick = (key: FeaturesNavKey) => {
		if (key === 'performance') {
			navigateToSiteEditorPath(ROUTES.performance, {
				direction: 'forward',
			});
		}
		setActiveKey(key);
	};

	return (
		<nav
			className={COMPONENT_SELECTOR.replace(/^\./, '')}
			aria-label={__('Site editor main navigation', 'blockera')}
			data-test="blockera-site-editor-main-navigation"
		>
			<NavCategory title={__('Design', 'blockera')}>
				{DESIGN_ITEMS.map((item) => (
					<NavItem
						key={item.key}
						label={item.label}
						icon={item.icon}
						isActive={activeKey === item.key}
						showChevron={item.showChevron !== false}
						onClick={() => onDesignClick(item.coreUidKey)}
						data-test={`blockera-site-editor-nav-${item.key}`}
					/>
				))}
			</NavCategory>

			<NavCategory title={__('Site', 'blockera')}>
				{SITE_ITEMS.map((item) => (
					<NavItem
						key={item.key}
						label={item.label}
						icon={item.icon}
						isActive={activeKey === item.key}
						onClick={() => onSiteClick(item.key)}
						data-test={`blockera-site-editor-nav-${item.key}`}
					/>
				))}
			</NavCategory>

			<NavCategory title={__('Features', 'blockera')}>
				{FEATURES_ITEMS.map((item) => (
					<NavItem
						key={item.key}
						label={item.label}
						icon={item.icon}
						iconLibrary={item.iconLibrary}
						isActive={activeKey === item.key}
						onClick={() => onFeaturesClick(item.key)}
						data-test={`blockera-site-editor-nav-${item.key}`}
					/>
				))}
			</NavCategory>

			<NavCategory title={__('Resources', 'blockera')}>
				<NavItem
					label={__('Community', 'blockera')}
					icon="community-conversation"
					iconLibrary="ui"
					href={RESOURCE_LINKS.community}
					external
					data-test="blockera-site-editor-nav-community"
				/>
				<NavItem
					label={__('Roadmap', 'blockera')}
					icon="changelog"
					iconLibrary="ui"
					href={RESOURCE_LINKS.roadmap}
					external
					data-test="blockera-site-editor-nav-roadmap"
				/>
				<NavItem
					label={__('Feature Requests', 'blockera')}
					icon="bolb"
					iconLibrary="ui"
					href={RESOURCE_LINKS.featureRequests}
					external
					data-test="blockera-site-editor-nav-feature-requests"
				/>
			</NavCategory>
		</nav>
	);
}
