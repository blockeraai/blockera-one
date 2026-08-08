/**
 * Templates-owned template parts sub-screen.
 * Lists active parts for an area; click opens live canvas preview (view mode).
 * Canvas iframe click uses core → canvas=edit.
 */

import { Button } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Blockera dependencies
 */
import { Flex } from '@blockera/controls';
import { Icon } from '@blockera/icons';

/**
 * Internal dependencies
 */
import { getSiteEditorPath } from '../utils';
import {
	buildTemplatePartItemPath,
	navigateTemplates,
	type PartAreaId,
} from './constants';
import { getTemplateTitle, type TemplateLike } from './templates-matchers';
import useTemplatesData from './use-templates-data';

type TemplatesPartsScreenProps = {
	area: PartAreaId;
};

function getPreviewedPartId(path: string): string | null {
	const prefix = '/wp_template_part/';
	if (!path.startsWith(prefix)) {
		return null;
	}
	return path.slice(prefix.length) || null;
}

export default function TemplatesPartsScreen({
	area,
}: TemplatesPartsScreenProps) {
	const { getPartsForArea, isLoading } = useTemplatesData();
	const parts = getPartsForArea(area);
	const [previewedId, setPreviewedId] = useState<string | null>(() =>
		getPreviewedPartId(getSiteEditorPath())
	);

	useEffect(() => {
		const sync = () =>
			setPreviewedId(getPreviewedPartId(getSiteEditorPath()));
		sync();
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	}, []);

	const openPartPreview = (part: TemplateLike) => {
		if (part.id === undefined) {
			return;
		}
		navigateTemplates(buildTemplatePartItemPath(part.id), {
			partsArea: area,
			activeView: null,
			clearFilter: true,
		});
		setPreviewedId(String(part.id));
	};

	return (
		<div
			className="blockera-site-editor-templates-parts"
			data-test="blockera-site-editor-templates-parts"
			data-area={area}
		>
			<p className="blockera-site-editor-templates-parts__hint">
				{__(
					'Active template parts. Select one to preview — click the canvas to edit.',
					'blockera'
				)}
			</p>
			{isLoading ? <p>{__('Loading…', 'blockera')}</p> : null}
			{!isLoading && parts.length === 0 ? (
				<p>
					{__('No active template parts in this area.', 'blockera')}
				</p>
			) : null}
			<ul className="blockera-site-editor-templates-parts__list">
				{parts.map((part: TemplateLike) => {
					const id = part.id !== undefined ? String(part.id) : '';
					const isActive = !!id && previewedId === id;

					return (
						<li key={id || part.slug}>
							<Button
								className={[
									'blockera-site-editor-templates-parts__row',
									isActive ? 'is-active' : '',
								]
									.filter(Boolean)
									.join(' ')}
								onClick={() => openPartPreview(part)}
								data-test={`blockera-site-editor-templates-part-${part.slug}`}
							>
								<Flex
									alignItems="center"
									justifyContent="space-between"
								>
									<span>{getTemplateTitle(part)}</span>
									<Icon
										library="wp"
										icon="chevron-right"
										iconSize={16}
									/>
								</Flex>
							</Button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
