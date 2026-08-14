/**
 * Performance panel — Features drill-down card.
 * Persists toggles on `root/site` (same Save Hub as Identity / Homepage).
 */

import { FormToggle } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SettingsPanelShell from '../components/settings-panel-shell';
import useEditedSiteRecord from '../hooks/use-edited-site-record';
import { DISABLE_EMOJIS_SETTING } from '../constants';
import './performance-panel.scss';

type SiteRecord = {
	[DISABLE_EMOJIS_SETTING]?: boolean | null;
};

/**
 * Toggle checked = feature enabled (emojis removed).
 *
 * - `true` / `undefined` (default before load) => ON
 * - `false` / `null` => OFF — WP REST maps stored boolean false / '' to `null`
 */
function isDisableEmojisChecked(value: boolean | null | undefined): boolean {
	if (value === false || value === null) {
		return false;
	}

	return true;
}

export default function PerformancePanel() {
	const { record: data, editSite } = useEditedSiteRecord<SiteRecord>();

	const disableEmojis = isDisableEmojisChecked(
		data?.[DISABLE_EMOJIS_SETTING]
	);

	return (
		<SettingsPanelShell
			title={__('Performance', 'blockera')}
			className="blockera-site-editor-performance-panel"
			data-test="blockera-site-editor-performance-panel"
		>
			<div
				className="blockera-site-editor-performance-panel__row"
				data-test="blockera-site-editor-performance-disable-emojis"
			>
				<div className="blockera-site-editor-performance-panel__copy">
					<span className="blockera-site-editor-performance-panel__title">
						{__('Disable Emojis Script', 'blockera')}
					</span>
					<p className="blockera-site-editor-performance-panel__help">
						{__(
							'Enable this option if you want to remove WordPress emojis script in order to improve the performance.',
							'blockera'
						)}
					</p>
				</div>
				<div className="blockera-site-editor-performance-panel__control">
					<FormToggle
						checked={disableEmojis}
						onChange={() => {
							editSite({
								[DISABLE_EMOJIS_SETTING]: !disableEmojis,
							});
						}}
						aria-label={__('Disable Emojis Script', 'blockera')}
					/>
				</div>
			</div>
		</SettingsPanelShell>
	);
}
