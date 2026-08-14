/**
 * Blockera One branding header for the Site Editor sidebar.
 * Brand mark + name, with a More menu that opens the theme Reset modal.
 *
 * Uses only `blockera-site-editor-main-panel-header*` classes so core
 * edit-site CSS updates cannot restyle this chrome.
 */

import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';

/**
 * Blockera dependencies
 */
import { Flex } from '@blockera/controls';
import { Icon } from '@blockera/icons';

/**
 * Internal dependencies
 */
import { ResetThemeModal } from './reset';
import './main-panel-header.scss';

/**
 * Branding row shown under core SiteHub on all Site Editor view-mode pages.
 */
export default function MainPanelHeader() {
	const [isResetModalOpen, setIsResetModalOpen] = useState(false);

	return (
		<>
			<div
				className="blockera-site-editor-main-panel-header"
				data-test="blockera-site-editor-main-panel-header"
			>
				<Flex
					gap="8px"
					alignItems="center"
					justifyContent="space-between"
					className="blockera-site-editor-main-panel-header__row"
				>
					<Flex
						gap="12px"
						alignItems="center"
						justifyContent="flex-start"
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
					</Flex>

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
									data-test="blockera-site-editor-reset"
									onClick={() => {
										setIsResetModalOpen(true);
										onClose();
									}}
								>
									{__('Reset theme', 'blockera')}
								</MenuItem>
							</MenuGroup>
						)}
					</DropdownMenu>
				</Flex>
			</div>

			{isResetModalOpen && (
				<ResetThemeModal onClose={() => setIsResetModalOpen(false)} />
			)}
		</>
	);
}
