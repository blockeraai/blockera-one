/**
 * Powered-by mark + more menu for the drill-down title row (Reset the Template).
 */

import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Modal,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { parse as parseBlocks } from '@wordpress/blocks';

/**
 * Blockera dependencies
 */
import { Flex } from '@blockera/controls';

/**
 * Internal dependencies
 */
import type { BuilderEntityPostType } from '../types';

type TemplateOptionsTitleActionsProps = {
	templateId: string | number | null;
	postType?: BuilderEntityPostType;
};

export function TemplateOptionsTitleActions({
	templateId,
	postType = 'wp_template',
}: TemplateOptionsTitleActionsProps) {
	const [isResetting, setIsResetting] = useState(false);
	const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch(
		coreStore
	) as unknown as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: string | number,
			edits: Record<string, unknown>
		) => void;
		saveEditedEntityRecord: (
			kind: string,
			name: string,
			key: string | number
		) => Promise<unknown>;
	};

	const popoverProps = useMemo(
		() => ({
			placement: 'bottom-end' as const,
			className: 'blockera-templates-builder-title-actions__more-popover',
		}),
		[]
	);
	const toggleProps = useMemo(
		() => ({
			size: 'compact' as const,
			disabled: !templateId || isResetting,
			'data-test': 'blockera-templates-builder-more',
		}),
		[isResetting, templateId]
	);

	const resetToTheme = useCallback(async () => {
		if (!templateId) {
			return;
		}
		setIsResetConfirmOpen(false);
		setIsResetting(true);
		try {
			const restBase =
				postType === 'wp_template_part'
					? 'template-parts'
					: 'templates';
			const themeFile = (await apiFetch({
				path: `/wp/v2/${restBase}/${templateId}?context=edit&source=theme`,
			})) as { content?: { raw?: string } | string };
			const raw =
				typeof themeFile.content === 'string'
					? themeFile.content
					: themeFile.content?.raw || '';
			const blocks = parseBlocks(raw);
			editEntityRecord('postType', postType, templateId, {
				blocks,
				content: raw,
				source: 'theme',
			});
			await saveEditedEntityRecord('postType', postType, templateId);
		} finally {
			setIsResetting(false);
		}
	}, [editEntityRecord, postType, saveEditedEntityRecord, templateId]);

	return (
		<div className="blockera-templates-builder-title-actions">
			<DropdownMenu
				icon={moreVertical}
				label={__('More', 'blockera')}
				className="blockera-templates-builder-title-actions__more"
				popoverProps={popoverProps}
				toggleProps={toggleProps}
			>
				{({ onClose }) => (
					<MenuGroup>
						<MenuItem
							data-test="blockera-templates-builder-reset"
							disabled={!templateId || isResetting}
							onClick={() => {
								onClose();
								setIsResetConfirmOpen(true);
							}}
						>
							{__('Reset the Template', 'blockera')}
						</MenuItem>
					</MenuGroup>
				)}
			</DropdownMenu>
			{isResetConfirmOpen && (
				<Modal
					title={__('Reset the Template', 'blockera')}
					onRequestClose={() => {
						if (!isResetting) {
							setIsResetConfirmOpen(false);
						}
					}}
				>
					<p>
						{__(
							'Reset this template to the theme default? Your customizations to this template will be removed.',
							'blockera'
						)}
					</p>
					<Flex
						gap="8px"
						alignItems="center"
						justifyContent="flex-end"
					>
						<Button
							variant="tertiary"
							disabled={isResetting}
							onClick={() => setIsResetConfirmOpen(false)}
						>
							{__('Cancel', 'blockera')}
						</Button>
						<Button
							variant="primary"
							isBusy={isResetting}
							disabled={isResetting}
							onClick={() => {
								void resetToTheme();
							}}
						>
							{__('Reset', 'blockera')}
						</Button>
					</Flex>
				</Modal>
			)}
		</div>
	);
}
