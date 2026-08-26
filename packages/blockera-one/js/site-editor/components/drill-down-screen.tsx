/**
 * Drill-down sidebar screen for Styles / Templates / Site Identity / Homepage /
 * Performance.
 *
 * Mirrors core `SidebarNavigationScreen` (back + title + content) without
 * importing `@wordpress/edit-site` internals. Back returns to Design root
 * unless `onBack` is provided (e.g. Templates parts sub-screen).
 *
 * Enter animation (forward/back) is shared with MainNavigation via
 * `useSidebarEnterClass` + `sidebar-enter.scss`. Applied here (not the core
 * wrapper) because:
 * - SPA navigate cannot call edit-site `SidebarNavigationContext`
 * - Core sets `shouldAnimate={false}` for `identity`
 * - Homepage/performance may inherit a stale context direction
 *
 * WP 7.1+: when `@wordpress/theme` is present (via `wp.theme`), non-flush
 * content is wrapped in ThemeProvider with a white background seed (same as
 * edit-site `CONTENT_COLOR` on `areas.content`) so Admin UI / Global Styles
 * get light `--wpds-*` tokens. Older WP has no ThemeProvider and no WPDS
 * issue — children render unchanged.
 */

import type { ComponentType, ReactNode } from 'react';

import {
	Button,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { Flex } from '@blockera/controls';

/**
 * Internal dependencies
 */
import { ROUTES } from '../constants';
import './drill-down-screen.scss';
import useClearCoreSidebarSlide from '../hooks/use-clear-core-slide';
import useSidebarEnterClass from '../hooks/use-sidebar-enter-class';
import { navigateToSiteEditorPath } from '../utils';

/**
 * Match edit-site layout content ThemeProvider seed.
 * Core: `source-codes/block-editor/packages/edit-site/src/components/layout/index.js`
 * (`CONTENT_COLOR` on `areas.content` / Styles). Nested under the dark admin
 * ThemeProvider so light `--wpds-*` surface tokens apply to sidebar cards.
 */
const CONTENT_COLOR = { background: '#ffffff' };

type ThemeProviderProps = {
	children?: ReactNode;
	color?: { background?: string; primary?: string };
};

type WpThemeGlobal = {
	theme?: {
		ThemeProvider?: ComponentType<ThemeProviderProps>;
	};
};

/**
 * Resolve ThemeProvider only if WordPress shipped `@wordpress/theme`.
 * Avoid static import so older WP (no `wp.theme`) never throws on load.
 */
function getThemeProvider(): ComponentType<ThemeProviderProps> | null {
	const theme = (window as Window & { wp?: WpThemeGlobal }).wp?.theme;
	return theme?.ThemeProvider ?? null;
}

export type DrillDownBreadcrumbItem = {
	label: string;
	/** When set, the segment is a button that navigates to that parent. */
	onClick?: () => void;
};

type DrillDownScreenProps = {
	title: string;
	children: ReactNode;
	/** Optional trailing controls (e.g. Styles Style Book). */
	actions?: ReactNode;
	/**
	 * Skip content padding and light ThemeProvider (e.g. Templates nav that
	 * stays on dark sidebar chrome tokens).
	 */
	flush?: boolean;
	/** Override back navigation (default: Design root `/`). */
	onBack?: () => void;
	/**
	 * Parent trail shown above the title (e.g. "All Archives" over "Sidebar").
	 * String / string[] stay display-only; items with `onClick` are navigable.
	 */
	breadcrumb?: string | string[] | DrillDownBreadcrumbItem[];
};

function normalizeBreadcrumb(
	breadcrumb: DrillDownScreenProps['breadcrumb']
): DrillDownBreadcrumbItem[] {
	if (!breadcrumb) {
		return [];
	}
	if (typeof breadcrumb === 'string') {
		return breadcrumb ? [{ label: breadcrumb }] : [];
	}
	return breadcrumb
		.map((item) => (typeof item === 'string' ? { label: item } : item))
		.filter((item) => !!item.label);
}

/**
 * Collapsed main-panel screen: back control, title, and panel body.
 * Back always navigates to Design root `/` (not styles navigator history).
 */
export default function DrillDownScreen({
	title,
	children,
	actions = null,
	flush = false,
	onBack,
	breadcrumb,
}: DrillDownScreenProps) {
	const icon = isRTL() ? chevronRight : chevronLeft;
	const breadcrumbSepIcon = isRTL() ? chevronLeft : chevronRight;
	const enterClass = useSidebarEnterClass();
	const backButtonRef = useRef<HTMLButtonElement>(null);

	// After core's layout effect may have applied a stale slide class.
	useClearCoreSidebarSlide();

	// Prefer the back control over breadcrumb links (which render above
	// visually via grid, but must not steal focus when the panel opens).
	useEffect(() => {
		const id = window.requestAnimationFrame(() => {
			backButtonRef.current?.focus();
		});
		return () => window.cancelAnimationFrame(id);
	}, []);

	const ThemeProvider = !flush ? getThemeProvider() : null;
	const content =
		ThemeProvider !== null ? (
			<ThemeProvider color={CONTENT_COLOR}>{children}</ThemeProvider>
		) : (
			children
		);

	const crumbs = normalizeBreadcrumb(breadcrumb);
	const hasBreadcrumb = crumbs.length > 0;

	return (
		<Flex
			className={classNames(
				'blockera-site-editor-drill-down',
				'blockera-site-editor-enter',
				enterClass
			)}
			direction="column"
			gap="0"
			justifyContent="flex-start"
			data-test="blockera-site-editor-drill-down"
		>
			<div
				className={classNames(
					'blockera-site-editor-drill-down__header',
					{ 'has-breadcrumb': hasBreadcrumb }
				)}
			>
				{/* Back first in DOM so it is the preferred focus target. */}
				<Button
					ref={backButtonRef}
					size="compact"
					icon={icon}
					label={__('Back', 'blockera')}
					showTooltip={false}
					className="blockera-site-editor-drill-down__back"
					data-test="blockera-site-editor-drill-down-back"
					onClick={() => {
						if (onBack) {
							onBack();
							return;
						}
						navigateToSiteEditorPath(ROUTES.home, {
							direction: 'back',
						});
					}}
				/>
				<Heading
					className="blockera-site-editor-drill-down__title"
					level={1}
					size={18}
				>
					{title}
				</Heading>
				{actions ? (
					<div className="blockera-site-editor-drill-down__actions-slot">
						{actions}
					</div>
				) : null}
				{hasBreadcrumb ? (
					<nav
						className="blockera-site-editor-drill-down__breadcrumb"
						aria-label={__('Breadcrumb', 'blockera')}
						data-test="blockera-site-editor-drill-down-breadcrumb"
					>
						{crumbs.map((item, index) => (
							<span
								key={`${item.label}-${index}`}
								className="blockera-site-editor-drill-down__breadcrumb-item"
							>
								{item.onClick ? (
									<button
										type="button"
										className="blockera-site-editor-drill-down__breadcrumb-link"
										onClick={item.onClick}
									>
										{item.label}
									</button>
								) : (
									<span className="blockera-site-editor-drill-down__breadcrumb-text">
										{item.label}
									</span>
								)}
								<span
									className="blockera-site-editor-drill-down__breadcrumb-sep"
									aria-hidden="true"
								>
									<Icon icon={breadcrumbSepIcon} size={20} />
								</span>
							</span>
						))}
					</nav>
				) : null}
			</div>
			<div
				className={classNames(
					'blockera-site-editor-drill-down__content',
					{ 'is-flush': flush }
				)}
			>
				{/*
				 * WP 7.1+: inject light design-system CSS vars (`--wpds-*`) when
				 * `wp.theme.ThemeProvider` exists. Missing on older WP — no-op.
				 * Skip when `flush` so Templates keep dark sidebar tokens.
				 */}
				{content}
			</div>
		</Flex>
	);
}
