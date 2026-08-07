/**
 * Custom Site Identity panel (logo, title, tagline) — sidebar drill-down card.
 * Edits `root/site` via public core-data APIs — no site icon.
 */

import {
	Button,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { MediaUploader, PoweredByOne } from '@blockera/controls';

/**
 * Internal dependencies
 */
import './site-identity-panel.scss';

type SiteRecord = {
	title?: string;
	description?: string;
	site_logo?: number;
};

type MediaRecord = {
	source_url?: string;
	media_details?: { sizes?: Record<string, { source_url?: string }> };
};

export default function SiteIdentityPanel() {
	const { data, media } = useSelect((select) => {
		const { getEditedEntityRecord, getMedia } = select(coreStore) as {
			getEditedEntityRecord: (
				kind: string,
				name: string
			) => SiteRecord | undefined;
			getMedia: (id: number) => MediaRecord | undefined;
		};
		const site = getEditedEntityRecord('root', 'site');
		const logoId = site?.site_logo;
		return {
			data: site,
			media: logoId && logoId > 0 ? getMedia(logoId) : undefined,
		};
	}, []);

	const { editEntityRecord } = useDispatch(coreStore) as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: undefined,
			edits: Partial<SiteRecord>
		) => void;
	};

	const onChange = (edits: Partial<SiteRecord>) => {
		editEntityRecord('root', 'site', undefined, edits);
	};

	const logoUrl =
		media?.media_details?.sizes?.medium?.source_url ||
		media?.media_details?.sizes?.thumbnail?.source_url ||
		media?.source_url;

	return (
		<div
			className="blockera-se-admin-ui-page blockera-site-editor-identity-panel"
			data-test="blockera-site-editor-identity-panel"
		>
			<div className="blockera-se-admin-ui-page__header">
				<HStack
					spacing={2}
					alignment="center"
					justify="space-between"
					className="blockera-se-admin-ui-page__header-content"
				>
					<h2 className="blockera-se-admin-ui-page__header-title">
						{__('Identity', 'blockera')}
					</h2>
					<span className="blockera-se-admin-ui-page__header-visual">
						<PoweredByOne />
					</span>
				</HStack>
			</div>
			<div className="blockera-se-admin-ui-page__content has-padding">
				<VStack spacing={6}>
					<div
						className="blockera-site-editor-identity-panel__field"
						data-test="blockera-site-editor-identity-logo"
					>
						<span className="blockera-site-editor-identity-panel__label">
							{__('Site Logo', 'blockera')}
						</span>
						<p className="blockera-site-editor-identity-panel__help">
							{__(
								"Displays in your site's layout via the Site Logo block.",
								'blockera'
							)}
						</p>
						{logoUrl ? (
							<div className="blockera-site-editor-identity-panel__logo-preview">
								<img
									src={logoUrl}
									alt={__('Site Logo', 'blockera')}
								/>
							</div>
						) : null}
						<HStack spacing={2} alignment="left">
							<MediaUploader
								allowedTypes={['image']}
								value={data?.site_logo || 0}
								onSelect={(image: { id?: number }) => {
									onChange({ site_logo: image?.id ?? 0 });
								}}
								render={({ open }: { open: () => void }) => (
									<Button
										variant="secondary"
										onClick={open}
										data-test="blockera-site-editor-identity-logo-choose"
									>
										{data?.site_logo
											? __('Replace logo', 'blockera')
											: __('Choose logo', 'blockera')}
									</Button>
								)}
							/>
							{!!data?.site_logo && (
								<Button
									variant="secondary"
									isDestructive
									onClick={() => onChange({ site_logo: 0 })}
									data-test="blockera-site-editor-identity-logo-remove"
								>
									{__('Remove', 'blockera')}
								</Button>
							)}
						</HStack>
					</div>

					<div data-test="blockera-site-editor-identity-title">
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={__('Site Title', 'blockera')}
							help={__(
								"Displays in your site's layout via the Site Title block.",
								'blockera'
							)}
							value={data?.title ?? ''}
							onChange={(title) => onChange({ title })}
						/>
					</div>

					<div data-test="blockera-site-editor-identity-tagline">
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={__('Site Tagline', 'blockera')}
							help={__(
								"In a few words, explain what this site is about. Displays in your site's layout via the Site Tagline block.",
								'blockera'
							)}
							value={data?.description ?? ''}
							onChange={(description) =>
								onChange({ description })
							}
						/>
					</div>
				</VStack>
			</div>
		</div>
	);
}
