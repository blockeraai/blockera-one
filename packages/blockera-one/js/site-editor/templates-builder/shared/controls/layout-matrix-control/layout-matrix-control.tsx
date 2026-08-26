/**
 * Alignment — Blockera LayoutMatrixControl with the direction radio
 * and X/Y axis selects unmounted (`isDirectionActive` /
 * `isAxisControlsActive`). Direction is forced to `defaultDirection` on
 * every change so valueCleanup cannot drop it.
 */

import { useCallback, useMemo } from '@wordpress/element';

import { classNames } from '@blockera/classnames';
import {
	ControlContextProvider,
	LayoutMatrixControl,
} from '@blockera/controls';

import { CONTROL_COLUMNS, fieldColumns } from '../constants';

const DEFAULT_COLUMN_LAYOUT = {
	direction: 'column',
	alignItems: '',
	justifyContent: '',
};

type LayoutMatrixControlRowProps = {
	controlId: string;
	label?: string;
	value: unknown;
	disabled?: boolean;
	attribute?: string;
	blockName?: string;
	isDirectionActive?: boolean;
	isAxisControlsActive?: boolean;
	defaultDirection?: 'row' | 'column';
	columns?: string;
	onChange: (next: Record<string, unknown>) => void;
};

export default function LayoutMatrixControlRow({
	controlId,
	label,
	value,
	disabled,
	attribute,
	blockName,
	isDirectionActive = false,
	isAxisControlsActive = false,
	defaultDirection = 'column',
	columns = CONTROL_COLUMNS,
	onChange,
}: LayoutMatrixControlRowProps) {
	const layoutValue =
		value && typeof value === 'object' && !Array.isArray(value)
			? value
			: DEFAULT_COLUMN_LAYOUT;
	// ControlContextProvider's useSelect deps on this object identity.
	const contextValue = useMemo(
		() => ({
			name: `templates-builder-${controlId}`,
			value: layoutValue,
			attribute,
			blockName,
		}),
		[controlId, layoutValue, attribute, blockName]
	);
	const handleChange = useCallback(
		(next: unknown) => {
			const nextObj =
				next && typeof next === 'object' && !Array.isArray(next)
					? (next as Record<string, unknown>)
					: {};
			onChange({
				...nextObj,
				direction: defaultDirection,
			});
		},
		[onChange, defaultDirection]
	);

	return (
		<ControlContextProvider value={contextValue}>
			<LayoutMatrixControl
				label={label ?? ''}
				columns={fieldColumns(label, columns)}
				fieldProps={{
					className: classNames(
						'blockera-templates-builder-layout-matrix',
						{
							'is-disabled': disabled,
						}
					),
					'data-test': 'blockera-templates-builder-layout-matrix',
				}}
				isDirectionActive={isDirectionActive}
				isAxisControlsActive={isAxisControlsActive}
				defaultDirection={defaultDirection}
				defaultValue={DEFAULT_COLUMN_LAYOUT}
				onChange={handleChange}
			/>
		</ControlContextProvider>
	);
}
