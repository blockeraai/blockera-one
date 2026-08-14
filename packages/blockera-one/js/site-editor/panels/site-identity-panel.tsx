/**
 * Custom Site Identity panel (logo, title, tagline) — sidebar drill-down card.
 * Edits `root/site` via public core-data APIs — no site icon.
 */

import { Button, TextControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { Flex, MediaUploader } from '@blockera/controls';

/**
 * Internal dependencies
 */
import SettingsPanelShell from '../components/settings-panel-shell';
import useEditedSiteRecord from '../hooks/use-edited-site-record';
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
	const { record: data, editSite: onChange } =
		useEditedSiteRecord<SiteRecord>();

	const logoId = data?.site_logo;
	const media = useSelect(
		(select) => {
			const { getMedia } = select(coreStore) as unknown as {
				getMedia: (id: number) => MediaRecord | undefined;
			};
			return logoId && logoId > 0 ? getMedia(logoId) : undefined;
		},
		[logoId]
	);

	const logoUrl =
		media?.media_details?.sizes?.medium?.source_url ||
		media?.media_details?.sizes?.thumbnail?.source_url ||
		media?.source_url;

	return (
		<SettingsPanelShell
			title={__('Site Identity', 'blockera')}
			className="blockera-site-editor-identity-panel"
			data-test="blockera-site-editor-identity-panel"
		>
			<Flex direction="column" gap="24px">
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
					<Flex
						gap="8px"
						alignItems="center"
						justifyContent="flex-start"
					>
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
					</Flex>
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
						onChange={(description) => onChange({ description })}
					/>
				</div>
			</Flex>
		</SettingsPanelShell>
	);
}
