/**
 * Blockera One branding header for the Site Editor sidebar.
 * Brand mark + name, with a More menu that includes core “Reset styles”.
 *
 * Uses only `blockera-site-editor-main-panel-header*` classes so core
 * edit-site CSS updates cannot restyle this chrome.
 */

import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

/**
 * Blockera dependencies
 */
import { Icon } from '@blockera/icons';

/**
 * Internal dependencies
 */
import './main-panel-header.scss';

type GlobalStylesRecord = {
	styles?: Record<string, unknown>;
	settings?: Record<string, unknown>;
};

/**
 * Branding row shown under core SiteHub on all Site Editor view-mode pages.
 */
export default function MainPanelHeader() {
	const { globalStylesId, canReset } = useSelect((select) => {
		const {
			__experimentalGetCurrentGlobalStylesId,
			getEditedEntityRecord,
		} = select(coreStore) as {
			__experimentalGetCurrentGlobalStylesId: () => number | undefined;
			getEditedEntityRecord: (
				kind: string,
				name: string,
				id: number
			) => GlobalStylesRecord | undefined;
		};

		const id = __experimentalGetCurrentGlobalStylesId();
		const record =
			typeof id === 'number'
				? getEditedEntityRecord('root', 'globalStyles', id)
				: undefined;

		const hasUserStyles =
			!!record &&
			(Object.keys(record.styles ?? {}).length > 0 ||
				Object.keys(record.settings ?? {}).length > 0);

		return {
			globalStylesId: id,
			canReset: hasUserStyles,
		};
	}, []);

	const { editEntityRecord } = useDispatch(coreStore) as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: number,
			edits: GlobalStylesRecord
		) => void;
	};

	const onResetStyles = () => {
		if (typeof globalStylesId !== 'number') {
			return;
		}

		// Same outcome as core `setUser({ styles: {}, settings: {} })`.
		editEntityRecord('root', 'globalStyles', globalStylesId, {
			styles: {},
			settings: {},
		});
	};

	return (
		<div
			className="blockera-site-editor-main-panel-header"
			data-test="blockera-site-editor-main-panel-header"
		>
			<HStack
				spacing={2}
				alignment="center"
				justify="space-between"
				className="blockera-site-editor-main-panel-header__row"
			>
				<HStack
					spacing={3}
					alignment="center"
					justify="flex-start"
					className="blockera-site-editor-main-panel-header__brand"
				>
					<span
						className="blockera-site-editor-main-panel-header__brand-mark"
						aria-hidden="true"
					>
						<Icon
							library="blockera"
							icon="blockera-one"
							iconSize={24}
						/>
					</span>
					<Heading
						className="blockera-site-editor-main-panel-header__title"
						level={1}
						size={18}
						data-test="blockera-site-editor-main-panel-header-title"
					>
						{__('Blockera One', 'blockera')}
					</Heading>
				</HStack>

				<DropdownMenu
					icon={moreVertical}
					label={__('More', 'blockera')}
					className="blockera-site-editor-main-panel-header__more"
					popoverProps={{
						placement: 'bottom-start',
						className:
							'blockera-site-editor-main-panel-header__more-popover',
					}}
					toggleProps={{
						size: 'compact',
						'data-test':
							'blockera-site-editor-main-panel-header-more',
					}}
				>
					{({ onClose }) => (
						<MenuGroup>
							<MenuItem
								disabled={!canReset}
								data-test="blockera-site-editor-reset-styles"
								onClick={() => {
									onResetStyles();
									onClose();
								}}
							>
								{__('Reset styles', 'blockera')}
							</MenuItem>
						</MenuGroup>
					)}
				</DropdownMenu>
			</HStack>
		</div>
	);
}
