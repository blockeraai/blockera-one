/**
 * Homepage Settings panel — Reading settings style UI in a sidebar drill-down card.
 * Edits show_on_front / page_on_front / page_for_posts on root/site.
 */

import {
	SelectControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { PoweredByOne } from '@blockera/controls';

/**
 * Internal dependencies
 */
import './homepage-settings-panel.scss';

type SiteRecord = {
	show_on_front?: string;
	page_on_front?: number;
	page_for_posts?: number;
};

type PageRecord = {
	id: number;
	title?: { rendered?: string } | string;
};

function getPageTitle(page: PageRecord): string {
	if (
		page.title &&
		typeof page.title === 'object' &&
		'rendered' in page.title
	) {
		return (
			decodeEntities(page.title.rendered || '') ||
			__('(no title)', 'blockera')
		);
	}

	if (typeof page.title === 'string' && page.title) {
		return page.title;
	}

	return __('(no title)', 'blockera');
}

export default function HomepageSettingsPanel() {
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

	const { records: pages } = useEntityRecords('postType', 'page', {
		per_page: -1,
		status: 'publish',
		orderby: 'title',
		order: 'asc',
	});

	const pageOptions = [
		{ label: __('— Select —', 'blockera'), value: '0' },
		...((pages as PageRecord[] | null) || []).map((page) => ({
			label: getPageTitle(page),
			value: String(page.id),
		})),
	];

	const showOnFront = data?.show_on_front === 'page' ? 'page' : 'posts';

	const onChange = (edits: Partial<SiteRecord>) => {
		editEntityRecord('root', 'site', undefined, edits);
	};

	return (
		<div
			className="blockera-se-admin-ui-page blockera-site-editor-homepage-panel"
			data-test="blockera-site-editor-homepage-panel"
		>
			<div className="blockera-se-admin-ui-page__header">
				<HStack
					spacing={2}
					alignment="center"
					justify="space-between"
					className="blockera-se-admin-ui-page__header-content"
				>
					<h2 className="blockera-se-admin-ui-page__header-title">
						{__('Home', 'blockera')}
					</h2>
					<span className="blockera-se-admin-ui-page__header-visual">
						<PoweredByOne />
					</span>
				</HStack>
			</div>
			<div className="blockera-se-admin-ui-page__content has-padding">
				<VStack spacing={4}>
					<fieldset className="blockera-site-editor-homepage-panel__fieldset">
						<legend className="blockera-site-editor-homepage-panel__legend">
							{__('Your homepage displays', 'blockera')}
						</legend>

						<label
							className="blockera-site-editor-homepage-panel__radio"
							htmlFor="blockera-show-on-front-posts"
						>
							<input
								id="blockera-show-on-front-posts"
								type="radio"
								name="blockera-show-on-front"
								data-test="blockera-site-editor-homepage-posts"
								checked={showOnFront === 'posts'}
								onChange={() =>
									onChange({ show_on_front: 'posts' })
								}
							/>
							<span>{__('Your latest posts', 'blockera')}</span>
						</label>

						<label
							className="blockera-site-editor-homepage-panel__radio"
							htmlFor="blockera-show-on-front-page"
						>
							<input
								id="blockera-show-on-front-page"
								type="radio"
								name="blockera-show-on-front"
								data-test="blockera-site-editor-homepage-static"
								checked={showOnFront === 'page'}
								onChange={() =>
									onChange({ show_on_front: 'page' })
								}
							/>
							<span>
								{__('A static page (select below)', 'blockera')}
							</span>
						</label>
					</fieldset>

					<div data-test="blockera-site-editor-homepage-page">
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={__('Homepage', 'blockera')}
							value={String(data?.page_on_front || 0)}
							options={pageOptions}
							disabled={showOnFront !== 'page'}
							onChange={(value) =>
								onChange({
									page_on_front: parseInt(value, 10) || 0,
								})
							}
						/>
					</div>

					<div data-test="blockera-site-editor-homepage-posts-page">
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={__('Posts page', 'blockera')}
							value={String(data?.page_for_posts || 0)}
							options={pageOptions}
							disabled={showOnFront !== 'page'}
							onChange={(value) =>
								onChange({
									page_for_posts: parseInt(value, 10) || 0,
								})
							}
						/>
					</div>
				</VStack>
			</div>
		</div>
	);
}
