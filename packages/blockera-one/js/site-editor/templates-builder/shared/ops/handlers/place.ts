/**
 * placeSection — move a section using the selected variant's placement rule.
 */

import { lookupFromControl } from '../../stamp-lookup';
import { placeSection } from '../../section-ops';
import type { OperationHandler } from '../types';

export const handlePlaceSection: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
}) => {
	const variant = control.variants?.find((v) => v.id === String(nextValue));
	if (!variant?.placement) {
		return null;
	}
	const tree = placeSection(blocks, {
		sectionId: control.target.id,
		placement: variant.placement,
		lookup: lookupFromControl(control, selectedClientId),
	});
	return { kind: 'blocks', blocks: tree };
};
