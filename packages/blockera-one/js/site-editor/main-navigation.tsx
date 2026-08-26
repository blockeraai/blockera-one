/**
 * Custom Design / Site / Features / Resources navigation for the Site Editor
 * main sidebar — rendered from the navigation catalog (navigation/nav-config).
 */

import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { useSiteEditorUrlState } from '@blockera/utils';

/**
 * Internal dependencies
 */
import Nav from './components/nav';
import NavItem from './components/nav-item';
import NavSection from './components/nav-section';
import { COMPONENT_SELECTOR } from './constants';
import './main-navigation.scss';
import useClearCoreSidebarSlide from './hooks/use-clear-core-slide';
import useSidebarEnterClass from './hooks/use-sidebar-enter-class';
import {
	MAIN_NAV_CATEGORIES,
	getMainNavItemsByCategory,
	type MainNavItemConfig,
} from './navigation/nav-config';
import {
	getActiveMainNavKey,
	navigateToSiteEditorPath,
	navigateViaCoreUid,
	setPendingSidebarNavDirection,
} from './utils';

function onNavItemClick(item: MainNavItemConfig): void {
	if (item.navigate === 'coreUid' && item.coreUid) {
		if (item.forwardDirection) {
			setPendingSidebarNavDirection('forward');
		}
		navigateViaCoreUid(item.coreUid);
		return;
	}

	if (item.navigate === 'path' && item.path) {
		navigateToSiteEditorPath(item.path, { direction: 'forward' });
	}
}

export default function MainNavigation() {
	const enterClass = useSidebarEnterClass();
	// Synced on every SPA navigation (core router included), not just popstate.
	const activeKey = useSiteEditorUrlState(getActiveMainNavKey);

	// Strip stale core slide classes (SidebarNavigationContext) that can
	// linger after Patterns / our drill-downs.
	useClearCoreSidebarSlide();

	return (
		<Nav
			className={classNames(
				COMPONENT_SELECTOR.replace(/^\./, ''),
				'blockera-site-editor-enter',
				enterClass
			)}
			aria-label={__('Site editor main navigation', 'blockera')}
			data-test="blockera-site-editor-main-navigation"
		>
			{MAIN_NAV_CATEGORIES.map((category) => (
				<NavSection key={category.id} title={category.label}>
					{getMainNavItemsByCategory(category.id).map((item) => (
						<NavItem
							key={item.key}
							label={item.label}
							icon={item.icon}
							href={
								item.navigate === 'external'
									? item.href
									: undefined
							}
							isActive={activeKey === item.key}
							onClick={
								item.navigate === 'external'
									? undefined
									: () => onNavItemClick(item)
							}
							data-test={`blockera-site-editor-nav-${item.key}`}
						/>
					))}
				</NavSection>
			))}
		</Nav>
	);
}
