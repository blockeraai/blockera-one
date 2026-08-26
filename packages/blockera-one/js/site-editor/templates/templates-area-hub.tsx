/**
 * Area Hub: live Editor for the site header/footer/sidebar (or empty state).
 */

import type { ReactNode } from 'react';

import { Button } from '@wordpress/components';
import { getQueryArg } from '@wordpress/url';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { classNames } from '@blockera/classnames';
import { Icon } from '@blockera/icons';
import { useSiteEditorUrlState } from '@blockera/utils';

/**
 * Internal dependencies
 */
import { ROUTES } from '../constants';
import { getSiteEditorPath } from '../utils';
import {
	buildTemplatePartItemPath,
	getTemplatesUrlState,
	navigateTemplates,
	navigateToPatternsTemplatePartArea,
	type PartAreaId,
} from './constants';
import { findCanonicalPart } from './templates-hub-parts';
import useOpenNavigationInterceptor from './use-open-navigation-interceptor';
import useTemplatesData from './use-templates-data';
import useTemplatesUrlState from './use-templates-url-state';
import './templates-area-hub.scss';

const AREA_ICON: Record<PartAreaId, { library: 'wp' | 'ui'; icon: string }> = {
	header: { library: 'ui', icon: 'template-header' },
	footer: { library: 'ui', icon: 'template-footer' },
	sidebar: { library: 'ui', icon: 'template-sidebar' },
};

type TemplatesAreaHubProps = {
	children?: ReactNode;
};

/**
 * Core “Open Navigation” sends template parts to Patterns
 * (`getNavigationPath` → `/pattern?postType=wp_template_part`). When the user
 * opened the part from Templates Area Hub, return to that hub instead.
 */
function returnToTemplatesPartsHub(area: PartAreaId): void {
	const path = getSiteEditorPath();
	const partId = getPreviewedPartId(path);

	if (partId) {
		navigateTemplates(buildTemplatePartItemPath(partId), {
			partsArea: area,
			activeView: null,
			clearFilter: true,
			canvas: null,
		});
		return;
	}

	navigateTemplates(ROUTES.templates, {
		partsArea: area,
		activeView: null,
		clearFilter: true,
		canvas: null,
	});
}

function getPreviewedPartId(path: string): string | null {
	const prefix = '/wp_template_part/';
	if (!path.startsWith(prefix)) {
		return null;
	}
	return path.slice(prefix.length) || null;
}

function readCanvasMode(): 'edit' | 'view' {
	return getQueryArg(window.location.href, 'canvas') === 'edit'
		? 'edit'
		: 'view';
}

// Core router uses history.navigate → pushState (no popstate); the shared
// URL-state hook listens to Blockera’s patched SPA navigate event as well.
function useCanvasMode(): 'edit' | 'view' {
	return useSiteEditorUrlState(readCanvasMode);
}

function usePartsArea(): PartAreaId | null {
	return useTemplatesUrlState().partsArea;
}

function sitePartLabel(area: PartAreaId): string {
	switch (area) {
		case 'header':
			return __('Global Header', 'blockera');
		case 'footer':
			return __('Global Footer', 'blockera');
		case 'sidebar':
			return __('Global Sidebar', 'blockera');
	}
}

function emptyPrimaryMessage(area: PartAreaId): string {
	switch (area) {
		case 'header':
			return __('No site header yet.', 'blockera');
		case 'footer':
			return __('No site footer yet.', 'blockera');
		case 'sidebar':
			return __('No site sidebar yet.', 'blockera');
	}
}

function manageAllPartsLabel(area: PartAreaId): string {
	switch (area) {
		case 'header':
			return __('Manage All Headers', 'blockera');
		case 'footer':
			return __('Manage All Footers', 'blockera');
		case 'sidebar':
			return __('Manage All Sidebars', 'blockera');
	}
}

function ManageAllPartsButton({ area }: { area: PartAreaId }) {
	return (
		<Button
			variant="primary"
			size="compact"
			className="blockera-site-editor-templates-area-hub__manage"
			onClick={() => navigateToPatternsTemplatePartArea(area)}
			data-test="blockera-site-editor-templates-area-hub-manage"
		>
			{manageAllPartsLabel(area)}
		</Button>
	);
}

export default function TemplatesAreaHub({ children }: TemplatesAreaHubProps) {
	const partsArea = usePartsArea();
	const canvas = useCanvasMode();
	const { parts, isLoading } = useTemplatesData();
	const primary = partsArea ? findCanonicalPart(partsArea, parts) : undefined;

	// Intercept core Open Navigation so Templates-owned parts don't land on Patterns.
	useOpenNavigationInterceptor((path) => {
		const area = getTemplatesUrlState().partsArea || partsArea;
		if (!area || !path.startsWith('/wp_template_part/')) {
			return false;
		}
		returnToTemplatesPartsHub(area);
		return true;
	}, !!partsArea);

	// Open / keep the site-wide part while Hub is selected.
	useEffect(() => {
		if (!partsArea || primary?.id === undefined) {
			return;
		}

		const currentId = getPreviewedPartId(getSiteEditorPath());
		if (String(currentId) === String(primary.id)) {
			return;
		}

		navigateTemplates(buildTemplatePartItemPath(primary.id), {
			partsArea,
			activeView: null,
			clearFilter: true,
			canvas: null,
		});
	}, [partsArea, primary?.id]);

	if (!partsArea) {
		return <>{children}</>;
	}

	// Browse content surface: empty state only (preview lives on part-item).
	if (!primary) {
		return (
			<div
				className="blockera-site-editor-templates-area-hub"
				data-test="blockera-site-editor-templates-area-hub"
				data-area={partsArea}
			>
				<div
					className="blockera-site-editor-templates-area-hub__empty"
					data-test="blockera-site-editor-templates-area-hub-empty"
				>
					<p>{emptyPrimaryMessage(partsArea)}</p>
					{isLoading ? <p>{__('Loading…', 'blockera')}</p> : null}
					<ManageAllPartsButton area={partsArea} />
				</div>
			</div>
		);
	}

	if (!children) {
		return null;
	}

	return (
		<div
			className={classNames('blockera-site-editor-templates-area-hub', {
				'is-edit-canvas': canvas === 'edit',
			})}
			data-test="blockera-site-editor-templates-area-hub"
			data-area={partsArea}
			data-canvas={canvas}
		>
			{canvas !== 'edit' ? (
				<div
					className="blockera-site-editor-templates-area-hub__banner"
					data-test="blockera-site-editor-templates-area-hub-banner"
				>
					<div className="blockera-site-editor-templates-area-hub__banner-leading">
						<span
							className="blockera-site-editor-templates-area-hub__banner-icon"
							aria-hidden="true"
						>
							<Icon
								library={AREA_ICON[partsArea].library}
								icon={AREA_ICON[partsArea].icon}
								iconSize={26}
							/>
						</span>
						<span className="blockera-site-editor-templates-area-hub__banner-title">
							{sitePartLabel(partsArea)}
						</span>
						<p className="blockera-site-editor-templates-area-hub__banner-hint">
							{__(
								'Editing this updates it everywhere this part is used.',
								'blockera'
							)}
						</p>
					</div>
					<ManageAllPartsButton area={partsArea} />
				</div>
			) : null}
			<div className="blockera-site-editor-templates-area-hub__canvas">
				{children}
			</div>
		</div>
	);
}
