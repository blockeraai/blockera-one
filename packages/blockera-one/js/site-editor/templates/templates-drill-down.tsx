/**
 * Templates sidebar drill-down: purpose menu or parts sub-screen.
 */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import DrillDownScreen from '../drill-down-screen';
import { ROUTES } from '../constants';
import {
	getTemplatesUrlState,
	navigateTemplates,
	type PartAreaId,
} from './constants';
import { PART_AREA_LABELS } from './templates-nav-config';
import TemplatesNav from './templates-nav';
import TemplatesPartsScreen from './templates-parts-screen';
import './style.scss';

export default function TemplatesDrillDown() {
	const [partsArea, setPartsArea] = useState<PartAreaId | null>(
		() => getTemplatesUrlState().partsArea
	);

	useEffect(() => {
		const sync = () => setPartsArea(getTemplatesUrlState().partsArea);
		sync();
		window.addEventListener('popstate', sync);
		return () => window.removeEventListener('popstate', sync);
	}, []);

	const openPartsArea = (area: PartAreaId) => {
		setPartsArea(area);
		// Stay on browse until a part is selected for canvas preview.
		navigateTemplates(ROUTES.templates, {
			partsArea: area,
			clearFilter: true,
			activeView: null,
			direction: 'forward',
		});
	};

	const closePartsArea = () => {
		setPartsArea(null);
		navigateTemplates(ROUTES.templates, {
			partsArea: null,
			direction: 'back',
		});
	};

	if (partsArea) {
		return (
			<DrillDownScreen
				title={PART_AREA_LABELS[partsArea]}
				onBack={closePartsArea}
				flush
			>
				<div className="blockera-site-editor-templates-panel">
					<TemplatesPartsScreen area={partsArea} />
				</div>
			</DrillDownScreen>
		);
	}

	return (
		<DrillDownScreen title={__('Templates', 'blockera')} flush>
			<div
				className="blockera-site-editor-templates-panel"
				data-test="blockera-site-editor-templates-panel"
			>
				<TemplatesNav onOpenPartsArea={openPartsArea} />
			</div>
		</DrillDownScreen>
	);
}
