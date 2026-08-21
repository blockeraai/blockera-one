/**
 * setBlockStyle — is-style-* class on the target and alsoSetOn stamps.
 */

import { lookupFromControl } from '../../stamp-lookup';
import { setSectionBlockStyle } from '../../section-ops';
import type { BlockNode, ControlDef } from '../../types';
import type { OperationHandler } from '../types';

export function applyBlockStyle(
	blocks: BlockNode[],
	control: ControlDef,
	styleName: string,
	selectedClientId?: string | null
): BlockNode[] {
	const lookup = lookupFromControl(control, selectedClientId);
	let next = setSectionBlockStyle(blocks, {
		sectionId: control.target.id,
		styleName,
		lookup,
	});
	const extras = control.alsoSetOn;
	if (extras?.length) {
		for (let i = 0; i < extras.length; i++) {
			next = setSectionBlockStyle(next, {
				sectionId: extras[i],
				styleName,
				lookup,
			});
		}
	}
	return next;
}

export const handleSetBlockStyle: OperationHandler = ({
	blocks,
	control,
	nextValue,
	selectedClientId,
}) => {
	return {
		kind: 'blocks',
		blocks: applyBlockStyle(
			blocks,
			control,
			String(nextValue || 'default'),
			selectedClientId
		),
	};
};
