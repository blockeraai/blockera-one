/**
 * Reactive Templates URL state ({ filter, partsArea, optionsPanel, path }).
 * One subscription per consumer via the shared Site Editor navigate hook.
 */

/**
 * Blockera dependencies
 */
import { useSiteEditorUrlState } from '@blockera/utils';

/**
 * Internal dependencies
 */
import { getTemplatesUrlState, type TemplatesUrlState } from './constants';

export default function useTemplatesUrlState(): TemplatesUrlState {
	return useSiteEditorUrlState(getTemplatesUrlState);
}
