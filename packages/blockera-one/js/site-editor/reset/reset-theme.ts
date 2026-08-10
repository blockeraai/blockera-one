/**
 * Client helper for Blockera One theme reset REST endpoint.
 */

import apiFetch from '@wordpress/api-fetch';

export type ResetThemeOptions = {
	resetStyles: boolean;
	resetTemplates: boolean;
	resetTemplateParts: boolean;
	resetHomepageSettings: boolean;
};

type ResetThemeResponse = {
	status?: string;
};

/**
 * Persist a theme reset for the selected customization groups.
 */
export async function resetTheme(
	options: ResetThemeOptions
): Promise<ResetThemeResponse> {
	const response = await apiFetch<ResetThemeResponse>({
		path: '/blockera-one/v1/reset-theme',
		method: 'PATCH',
		data: options,
	});

	if (response?.status !== 'SUCCESS') {
		throw new Error(
			`Failed to reset theme: ${response?.status ?? 'unknown'}`
		);
	}

	return response;
}
