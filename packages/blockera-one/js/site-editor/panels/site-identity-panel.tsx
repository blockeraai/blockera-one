/**
 * Site Identity panel — core WP 7.1 Identity form (DataForm + MediaEdit)
 * inside Blockera One’s sidebar drill-down card.
 *
 * Source: source-codes/block-editor/packages/edit-site/src/components/sidebar-identity/index.js
 * (`SidebarIdentity`). Saves via `root/site` (native Save Hub).
 */

import { DataForm } from '@wordpress/dataviews';
import type { DataFormControlProps, Field, Form } from '@wordpress/dataviews';
import { MediaEdit } from '@wordpress/fields';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

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
	site_icon?: number;
};

function wrapMediaEdit(testId: string) {
	return function IdentityMediaEdit(props: DataFormControlProps<SiteRecord>) {
		return (
			<div data-test={testId}>
				<MediaEdit {...props} />
			</div>
		);
	};
}

const identityFields: Field<SiteRecord>[] = [
	{
		id: 'title',
		type: 'text',
		label: __('Site Title', 'blockera'),
		description: __(
			"Displays in your site's layout via the Site Title block.",
			'blockera'
		),
		getValue: ({ item }) => decodeEntities(item.title ?? ''),
	},
	{
		id: 'description',
		type: 'text',
		label: __('Site Tagline', 'blockera'),
		description: __(
			"In a few words, explain what this site is about. Displays in your site's layout via the Site Tagline block.",
			'blockera'
		),
		getValue: ({ item }) => decodeEntities(item.description ?? ''),
	},
	{
		id: 'site_logo',
		type: 'media',
		label: __('Site Logo', 'blockera'),
		description: __(
			"Displays in your site's layout via the Site Logo block.",
			'blockera'
		),
		placeholder: __('Choose logo', 'blockera'),
		Edit: wrapMediaEdit('blockera-site-editor-identity-logo'),
		setValue: ({ value }) => ({
			site_logo: (value as number | undefined) ?? 0,
		}),
	},
	{
		id: 'site_icon',
		type: 'media',
		label: __('Site Icon', 'blockera'),
		description: __(
			'Shown in browser tabs, bookmarks, and mobile apps. It should be square and at least 512 by 512 pixels.',
			'blockera'
		),
		placeholder: __('Choose icon', 'blockera'),
		Edit: wrapMediaEdit('blockera-site-editor-identity-icon'),
		setValue: ({ value }) => ({
			site_icon: (value as number | undefined) ?? 0,
		}),
	},
];

const identityForm: Form = {
	layout: {
		type: 'regular',
		labelPosition: 'top',
	},
	fields: ['title', 'description', 'site_logo', 'site_icon'],
};

export default function SiteIdentityPanel() {
	const { record: data, editSite: onChange } =
		useEditedSiteRecord<SiteRecord>();

	return (
		<SettingsPanelShell
			title={__('Site Identity', 'blockera')}
			className="blockera-site-editor-identity-panel"
			data-test="blockera-site-editor-identity-panel"
		>
			{data ? (
				<DataForm
					data={data}
					fields={identityFields}
					form={identityForm}
					onChange={onChange}
				/>
			) : null}
		</SettingsPanelShell>
	);
}
