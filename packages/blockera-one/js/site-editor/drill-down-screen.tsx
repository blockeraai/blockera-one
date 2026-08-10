/**
 * Drill-down sidebar screen for Styles / Templates / Site Identity / Homepage /
 * Performance.
 *
 * Mirrors core `SidebarNavigationScreen` (back + title + content) without
 * importing `@wordpress/edit-site` internals. Back returns to Design root
 * unless `onBack` is provided (e.g. Templates parts sub-screen).
 *
 * Enter animation matches core Patterns/Pages (`slide-from-right` keyframes).
 * Applied on this screen (not the core wrapper) because:
 * - SPA navigate cannot call edit-site `SidebarNavigationContext`
 * - Core sets `shouldAnimate={false}` for `identity`
 * - Homepage/performance may inherit a stale context direction
 */

import type { ReactNode } from 'react';

import {
	Button,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ROUTES } from './constants';
import './drill-down-screen.scss';
import {
	clearCoreSidebarSlideClasses,
	consumePendingSidebarNavDirection,
	navigateToSiteEditorPath,
} from './utils';

type DrillDownScreenProps = {
	title: string;
	children: ReactNode;
	/** Optional trailing controls (e.g. Styles Style Book). */
	actions?: ReactNode;
	/** Skip content padding (e.g. full-bleed Global Styles UI). */
	flush?: boolean;
	/** Override back navigation (default: Design root `/`). */
	onBack?: () => void;
};

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
}: DrillDownScreenProps) {
	const icon = isRTL() ? chevronRight : chevronLeft;
	const [enterClass] = useState(() => {
		const direction = consumePendingSidebarNavDirection();
		// Only animate when an explicit forward nav was requested.
		// Remounts from `p` changes (e.g. Pages ↔ Child templates) leave
		// direction null — treating null as forward caused spurious slides.
		return direction === 'forward' ? 'is-entering-forward' : '';
	});

	useEffect(() => {
		// After core's layout effect may have applied a stale slide class.
		clearCoreSidebarSlideClasses();
		const id = window.requestAnimationFrame(() => {
			clearCoreSidebarSlideClasses();
		});
		return () => window.cancelAnimationFrame(id);
	}, []);

	return (
		<VStack
			className={['blockera-site-editor-drill-down', enterClass]
				.filter(Boolean)
				.join(' ')}
			spacing={0}
			justify="flex-start"
			data-test="blockera-site-editor-drill-down"
		>
			<HStack
				spacing={3}
				alignment="center"
				className="blockera-site-editor-drill-down__title-row"
			>
				<Button
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
						navigateToSiteEditorPath(ROUTES.home);
					}}
				/>
				<Heading
					className="blockera-site-editor-drill-down__title"
					level={1}
					size={18}
				>
					{title}
				</Heading>
				{actions}
			</HStack>
			<div
				className={[
					'blockera-site-editor-drill-down__content',
					flush ? 'is-flush' : '',
				]
					.filter(Boolean)
					.join(' ')}
			>
				{children}
			</div>
		</VStack>
	);
}
