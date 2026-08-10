/**
 * Reset theme confirmation modal — delete-variation style UX with
 * four toggles (styles / templates / template-parts / homepage) + consent checkbox.
 */

import { ToggleControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Blockera dependencies
 */
import { componentInnerClassNames } from '@blockera/classnames';
import {
	Button,
	CheckboxControl,
	ControlContextProvider,
	Flex,
	Modal,
	NoticeControl,
} from '@blockera/controls';
import { Icon } from '@blockera/icons';

/**
 * Internal dependencies
 */
import { resetTheme } from './reset-theme';
import './style.scss';

type ResetThemeModalProps = {
	onClose: () => void;
};

/**
 * Destructive confirm modal for resetting theme DB customizations.
 */
export default function ResetThemeModal({ onClose }: ResetThemeModalProps) {
	const [resetStyles, setResetStyles] = useState(true);
	const [resetTemplates, setResetTemplates] = useState(true);
	const [resetTemplateParts, setResetTemplateParts] = useState(true);
	const [resetHomepageSettings, setResetHomepageSettings] = useState(true);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [isBusy, setIsBusy] = useState(false);

	const { createErrorNotice } = useDispatch(noticesStore);

	const hasSelection =
		resetStyles ||
		resetTemplates ||
		resetTemplateParts ||
		resetHomepageSettings;
	const canSubmit = isConfirmed && hasSelection && !isBusy;

	const handleClose = () => {
		if (isBusy) {
			return;
		}

		onClose();
	};

	const handleReset = async () => {
		if (!canSubmit) {
			return;
		}

		setIsBusy(true);

		try {
			await resetTheme({
				resetStyles,
				resetTemplates,
				resetTemplateParts,
				resetHomepageSettings,
			});
			onClose();
			window.location.reload();
		} catch {
			setIsBusy(false);
			createErrorNotice(
				__('An error occurred while resetting the theme.', 'blockera'),
				{ type: 'snackbar' }
			);
		}
	};

	return (
		<Modal
			className={`${componentInnerClassNames('delete-modal')} blockera-site-editor-reset-theme-modal`}
			headerIcon={<Icon icon="trash" iconSize="34" />}
			headerTitle={__('Reset Blockera One Theme', 'blockera')}
			isDismissible={!isBusy}
			onRequestClose={handleClose}
			actions={
				<>
					<Button
						data-test="blockera-site-editor-reset-theme-cancel"
						variant="tertiary"
						disabled={isBusy}
						onClick={handleClose}
					>
						{__('Cancel', 'blockera')}
					</Button>
					<Button
						data-test="blockera-site-editor-reset-theme-confirm"
						variant="primary"
						disabled={!canSubmit}
						isBusy={isBusy}
						onClick={handleReset}
					>
						{__('Reset', 'blockera')}
					</Button>
				</>
			}
		>
			<div data-test="blockera-site-editor-reset-theme-modal">
				<Flex direction="column" gap={30}>
					<Flex direction="column" gap={15}>
						<p style={{ margin: '0', color: '#1e1e1e' }}>
							{__(
								'Selected customizations will be permanently removed from your site. Theme files are not modified.',
								'blockera'
							)}
						</p>

						<div
							className="blockera-site-editor-reset-theme-modal__options"
							data-test="blockera-site-editor-reset-theme-options"
						>
							<div data-test="blockera-site-editor-reset-option-styles">
								<ToggleControl
									__nextHasNoMarginBottom
									label={__('Reset theme styles', 'blockera')}
									help={__(
										'Reset customizations to theme styles and settings.',
										'blockera'
									)}
									checked={resetStyles}
									disabled={isBusy}
									onChange={setResetStyles}
								/>
							</div>
							<div data-test="blockera-site-editor-reset-option-templates">
								<ToggleControl
									__nextHasNoMarginBottom
									label={__(
										'Reset theme templates',
										'blockera'
									)}
									help={__(
										'Reset customizations to theme templates.',
										'blockera'
									)}
									checked={resetTemplates}
									disabled={isBusy}
									onChange={setResetTemplates}
								/>
							</div>
							<div data-test="blockera-site-editor-reset-option-template-parts">
								<ToggleControl
									__nextHasNoMarginBottom
									label={__(
										'Reset theme template-parts',
										'blockera'
									)}
									help={__(
										'Reset customizations to theme template-parts.',
										'blockera'
									)}
									checked={resetTemplateParts}
									disabled={isBusy}
									onChange={setResetTemplateParts}
								/>
							</div>
							<div data-test="blockera-site-editor-reset-option-homepage">
								<ToggleControl
									__nextHasNoMarginBottom
									label={__(
										'Reset homepage settings',
										'blockera'
									)}
									help={__(
										'Reset customizations to homepage reading settings.',
										'blockera'
									)}
									checked={resetHomepageSettings}
									disabled={isBusy}
									onChange={setResetHomepageSettings}
								/>
							</div>
						</div>
					</Flex>

					<Flex
						gap={15}
						className={componentInnerClassNames('consent-wrapper')}
						direction="column"
					>
						<NoticeControl type="error">
							{__('This action cannot be undone.', 'blockera')}
						</NoticeControl>

						<div data-test="blockera-site-editor-reset-theme-consent">
							<ControlContextProvider
								value={{
									name: 'confirm-reset-theme',
									value: isConfirmed,
								}}
							>
								<CheckboxControl
									checkboxLabel={__(
										'I understand and want to reset the theme.',
										'blockera'
									)}
									onChange={(newValue: boolean) =>
										setIsConfirmed(newValue)
									}
									isBold={true}
									disabled={isBusy}
								/>
							</ControlContextProvider>
						</div>
					</Flex>
				</Flex>
			</div>
		</Modal>
	);
}
