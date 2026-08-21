/**
 * Styles-group heading Edit button — jumps to the section in the canvas.
 */

import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Icon } from '@blockera/icons';

import { selectSectionInCanvas } from './canvas/select-section-in-canvas';

export type GroupHeaderEditProps = {
	/** Customize control id (data-test suffix). */
	controlId: string;
	sectionId: string;
	disabled?: boolean;
};

export default function GroupHeaderEdit({
	controlId,
	sectionId,
	disabled,
}: GroupHeaderEditProps) {
	const onCustomize = useCallback(() => {
		selectSectionInCanvas(sectionId);
	}, [sectionId]);

	return (
		<Button
			variant="secondary"
			size="compact"
			disabled={disabled}
			label={__('Customize in the block editor', 'blockera')}
			showTooltip
			onClick={onCustomize}
			className="blockera-templates-builder-header-edit"
			data-test={`blockera-templates-builder-customize-${controlId}`}
		>
			<Icon library="ui" icon="pen-external" iconSize={22} />
		</Button>
	);
}
