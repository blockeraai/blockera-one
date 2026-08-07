/**
 * Performance panel — Features drill-down card.
 * Persists toggles on `root/site` (same Save Hub as Identity / Homepage).
 */

import {
	FormToggle,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { PoweredByOne } from '@blockera/controls';

/**
 * Internal dependencies
 */
import { DISABLE_EMOJIS_SETTING } from './constants';
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
	const data = useSelect((select) => {
		const { getEditedEntityRecord } = select(coreStore) as {
			getEditedEntityRecord: (
				kind: string,
				name: string
			) => SiteRecord | undefined;
		};
		return getEditedEntityRecord('root', 'site');
	}, []);

	const { editEntityRecord } = useDispatch(coreStore) as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: undefined,
			edits: Partial<SiteRecord>
		) => void;
	};

	const disableEmojis = isDisableEmojisChecked(
		data?.[DISABLE_EMOJIS_SETTING]
	);

	return (
		<div
			className="blockera-se-admin-ui-card admin-ui-page blockera-site-editor-performance-panel"
			data-test="blockera-site-editor-performance-panel"
		>
			<div className="admin-ui-page__header">
				<HStack
					spacing={2}
					alignment="center"
					justify="space-between"
					className="admin-ui-page__header-content"
				>
					<h2 className="admin-ui-page__header-title">
						{__('Performance', 'blockera')}
					</h2>
					<span className="admin-ui-page__header-visual">
						<PoweredByOne />
					</span>
				</HStack>
			</div>
			<div className="admin-ui-page__content has-padding">
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
								editEntityRecord('root', 'site', undefined, {
									[DISABLE_EMOJIS_SETTING]: !disableEmojis,
								});
							}}
							aria-label={__('Disable Emojis Script', 'blockera')}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
