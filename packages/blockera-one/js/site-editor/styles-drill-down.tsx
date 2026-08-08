/**
 * Styles sidebar drill-down: hide core Admin UI Page header title chrome and
 * DOM-move Style Book into the DrillDownScreen title row (More menu is hidden).
 *
 * Avoids `@wordpress/edit-site` / editor private-API unlock by relocating the
 * existing Page header-actions node React already rendered.
 *
 * Shipped WP `edit-site` wraps actions in `.admin-ui-page__header-actions`
 * (no `.edit-site-styles__header-actions` class on the HStack). Keep the
 * legacy selector as a forward-compatible fallback.
 */

import type { ReactNode } from 'react';

import { useLayoutEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DrillDownScreen from './drill-down-screen';

/** Prefer current WP Admin UI wrapper; fall back to older edit-site class. */
const ACTIONS_SELECTORS = [
	'.admin-ui-page__header-actions',
	'.edit-site-styles__header-actions',
] as const;

type StylesDrillDownProps = {
	children: ReactNode;
};

function queryActionsNode(root: HTMLElement): HTMLElement | null {
	for (const selector of ACTIONS_SELECTORS) {
		const node = root.querySelector(selector);
		if (node instanceof HTMLElement) {
			return node;
		}
	}
	return null;
}

export default function StylesDrillDown({ children }: StylesDrillDownProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const actionsSlotRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const panel = panelRef.current;
		const slot = actionsSlotRef.current;
		if (!panel || !slot) {
			return;
		}

		let moved: HTMLElement | null = null;
		let originalParent: Node | null = null;
		let originalNextSibling: ChildNode | null = null;

		const moveActions = () => {
			const alreadyInSlot = queryActionsNode(slot);
			if (alreadyInSlot) {
				moved = alreadyInSlot;
				return;
			}

			const actions = queryActionsNode(panel);
			if (!actions) {
				return;
			}

			/*
			 * React remounted a fresh actions row inside the (hidden) Page
			 * header — replace any stale node we previously moved into the slot.
			 */
			while (slot.firstChild) {
				slot.removeChild(slot.firstChild);
			}

			originalParent = actions.parentElement;
			originalNextSibling = actions.nextSibling;
			slot.appendChild(actions);
			moved = actions;
		};

		moveActions();

		const observer = new MutationObserver(() => {
			moveActions();
		});
		observer.observe(panel, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
			if (
				moved &&
				originalParent &&
				moved.parentElement === slot &&
				originalParent.isConnected
			) {
				originalParent.insertBefore(moved, originalNextSibling);
			}
		};
	}, []);

	return (
		<DrillDownScreen
			title={__('Styles', 'blockera')}
			actions={
				<div
					ref={actionsSlotRef}
					className="blockera-site-editor-drill-down__actions"
					data-test="blockera-site-editor-styles-actions"
				/>
			}
		>
			<div
				ref={panelRef}
				className="blockera-se-admin-ui-card blockera-site-editor-styles-panel"
				data-test="blockera-site-editor-styles-panel"
			>
				{children}
			</div>
		</DrillDownScreen>
	);
}
