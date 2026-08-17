/**
 * Style variation picker — Blockera style-variations-button in pick-only
 * mode (search + apply). Add / save / duplicate and item menus are hidden.
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

import { BaseControl } from '@blockera/controls';
import {
	BlockEditContextProvider,
	BlockStyleVariations,
	getBaseBreakpoint,
	useBlockStyleVariations,
} from '@blockera/editor';

import { findByStamp } from '../../tree';
import type { BlockNode } from '../../types';
import { CONTROL_COLUMNS, fieldColumns } from '../constants';
import './block-style-select.scss';

type BlockStyleSelectProps = {
	controlId: string;
	label?: string;
	value: string | null;
	blockName?: string;
	sectionId?: string;
	disabled?: boolean;
	defaultValue?: string;
	columns?: string;
	onChange: (next: string) => void;
};

const PICKER_CONTEXT = {
	isNormalState: () => true,
	masterIsNormalState: () => true,
	currentBlock: 'master',
	currentState: 'normal',
	currentInnerBlockState: 'normal',
	currentTab: '',
	getBlockType: '',
	blockStateId: 0,
	breakpointId: 0,
	getAttributes: () => ({}),
	setCurrentTab: () => {},
	defaultAttributes: {},
	blockeraInnerBlocks: {},
	handleOnChangeAttributes: () => {},
};

export default function BlockStyleSelect({
	controlId,
	label,
	value,
	blockName,
	sectionId,
	disabled,
	columns = CONTROL_COLUMNS,
	onChange,
}: BlockStyleSelectProps) {
	const clientId = useSelect(
		(select) => {
			if (!sectionId) {
				return '';
			}
			const getBlocks = (
				select(blockEditorStore) as unknown as {
					getBlocks?: () => BlockNode[];
				}
			).getBlocks;
			if (typeof getBlocks !== 'function') {
				return '';
			}
			const match = findByStamp(
				getBlocks(),
				(stamp) => stamp?.id === sectionId
			);
			return match?.block?.clientId || '';
		},
		[sectionId]
	);

	const variationProps = useBlockStyleVariations({
		clientId,
		blockName: blockName || '',
		storedAttributes: {},
		defaultAttributes: {},
		enabled: !!blockName && !disabled,
		pickOnly: true,
	});

	const breakpoint = getBaseBreakpoint();

	const picker =
		!blockName || disabled ? null : (
			<BlockEditContextProvider
				{...PICKER_CONTEXT}
				currentBreakpoint={breakpoint}
			>
				<div data-style-variations-anchor>
					<BlockStyleVariations
						{...variationProps}
						pickOnly
						clientId={clientId}
						blockName={blockName}
						currentBlock="master"
						currentState="normal"
						currentBreakpoint={breakpoint}
						context="inspector-controls"
						hasChangesets={false}
						onCommitStyle={(style: { name?: string }) => {
							onChange(style?.name || 'default');
						}}
					/>
				</div>
			</BlockEditContextProvider>
		);

	return (
		<div
			className={
				!blockName || disabled
					? 'blockera-templates-builder-style-variations is-disabled'
					: 'blockera-templates-builder-style-variations'
			}
			data-test="blockera-templates-builder-style-variations"
			data-control-id={controlId}
			data-active-style={value || 'default'}
		>
			<BaseControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				controlName="style-variations"
			>
				{picker}
			</BaseControl>
		</div>
	);
}
