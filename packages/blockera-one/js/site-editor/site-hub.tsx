/**
 * Blockera replacement for core `.edit-site-site-hub`.
 * Logo → dashboard (arrow-up-left on hover), site title → front, search → commands.
 *
 * Uses only `blockera-site-editor-site-hub*` classes so core edit-site CSS
 * updates cannot restyle this chrome.
 */

import {
	Button,
	Icon as WPIcon,
	VisuallyHidden,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { store as commandsStore } from '@wordpress/commands';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { arrowUpLeft, search as searchIcon, wordpress } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
import { filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { getWpAdminDashboardUrl } from './utils';
import './site-hub.scss';

/**
 * Site icon / WordPress mark — mirrors core SiteIcon without edit-site imports.
 */
function SiteHubIcon({ className }: { className?: string }) {
	const { isRequestingSite, siteIconUrl } = useSelect((select) => {
		const { getEntityRecord } = select(coreStore) as {
			getEntityRecord: (
				kind: string,
				name: string,
				key?: undefined
			) => { site_icon_url?: string } | undefined;
		};
		const siteData = getEntityRecord('root', '__unstableBase', undefined);
		return {
			isRequestingSite: !siteData,
			siteIconUrl: siteData?.site_icon_url,
		};
	}, []);

	if (isRequestingSite && !siteIconUrl) {
		return <div className="blockera-site-editor-site-hub__icon-image" />;
	}

	const icon = siteIconUrl ? (
		<img
			className="blockera-site-editor-site-hub__icon-image"
			alt={__('Site Icon', 'blockera')}
			src={siteIconUrl}
		/>
	) : (
		<WPIcon
			className="blockera-site-editor-site-hub__icon-mark"
			icon={wordpress}
			size={48}
		/>
	);

	return (
		<div
			className={['blockera-site-editor-site-hub__icon', className]
				.filter(Boolean)
				.join(' ')}
		>
			{icon}
		</div>
	);
}

/**
 * Blockera site hub chrome for the Site Editor sidebar.
 */
export default function SiteHub() {
	const [dashboardUrl, setDashboardUrl] = useState(getWpAdminDashboardUrl);
	const { open: openCommandCenter } = useDispatch(commandsStore) as {
		open: () => void;
	};

	const { homeUrl, siteTitle } = useSelect((select) => {
		const { getEntityRecord } = select(coreStore) as {
			getEntityRecord: (
				kind: string,
				name: string,
				key?: undefined
			) =>
				| {
						title?: string;
						url?: string;
						home?: string;
				  }
				| undefined;
		};
		const site = getEntityRecord('root', 'site');
		const base = getEntityRecord('root', '__unstableBase');
		const title =
			!site?.title && site?.url
				? filterURLForDisplay(site.url)
				: site?.title;

		return {
			homeUrl: base?.home,
			siteTitle: title || '',
		};
	}, []);

	useEffect(() => {
		setDashboardUrl(getWpAdminDashboardUrl());
	}, []);

	return (
		<div
			className="blockera-site-editor-site-hub"
			data-test="blockera-site-editor-site-hub"
		>
			<HStack justify="flex-start" spacing={0}>
				<div className="blockera-site-editor-site-hub__toggle-container">
					<Button
						__next40pxDefaultSize
						href={dashboardUrl}
						label={__('Go to the Dashboard', 'blockera')}
						className="blockera-site-editor-site-hub__toggle"
						data-test="blockera-site-editor-site-hub-dashboard"
					>
						<span className="blockera-site-editor-site-hub__toggle-face blockera-site-editor-site-hub__toggle-face--site">
							<SiteHubIcon className="blockera-site-editor-site-hub__toggle-icon" />
						</span>
						<span
							className="blockera-site-editor-site-hub__toggle-face blockera-site-editor-site-hub__toggle-face--back"
							aria-hidden="true"
						>
							<WPIcon icon={arrowUpLeft} size={34} />
						</span>
					</Button>
				</div>

				<HStack>
					<div className="blockera-site-editor-site-hub__title">
						<Button
							__next40pxDefaultSize
							variant="link"
							href={homeUrl}
							target="_blank"
							data-test="blockera-site-editor-site-hub-title"
						>
							{decodeEntities(siteTitle)}
							<VisuallyHidden as="span">
								{__('(opens in a new tab)', 'blockera')}
							</VisuallyHidden>
						</Button>
					</div>
					<HStack
						spacing={0}
						expanded={false}
						className="blockera-site-editor-site-hub__actions"
					>
						<Button
							size="compact"
							className="blockera-site-editor-site-hub__command-center"
							icon={searchIcon}
							onClick={() => openCommandCenter()}
							label={__('Open command palette', 'blockera')}
							shortcut={displayShortcut.primary('k')}
							data-test="blockera-site-editor-site-hub-command"
						/>
					</HStack>
				</HStack>
			</HStack>
		</div>
	);
}
