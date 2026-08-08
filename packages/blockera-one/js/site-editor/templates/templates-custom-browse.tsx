/**
 * Custom templates browse — filtered DataViews for `is_custom` layouts.
 */

import { FILTER_IDS } from './constants';
import TemplatesFilteredBrowse from './templates-filtered-browse';

export default function TemplatesCustomBrowse() {
	return (
		<TemplatesFilteredBrowse
			filter={FILTER_IDS.custom}
			dataTest="blockera-site-editor-templates-custom"
		/>
	);
}
