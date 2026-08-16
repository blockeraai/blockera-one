/**
 * Bind a template options config to the edited wp_template entity + site
 * settings. Thin React hook — pure logic lives in `resolve-control-values.ts`
 * (state resolution) and `apply-operation.ts` (operation dispatch).
 */

import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { parseBlocks, toEntityEdits } from './blocks-adapter';
import {
	TEMPLATE_SETTINGS_KEY,
	type TemplateSettingsRecord,
} from './constants';
import { applyOperation } from './apply-operation';
import {
	isPresenceToggle,
	resolveEnableScrollTarget,
} from './resolve-options-panel';
import {
	cancelStampCanvasReveal,
	scrollStampIntoCanvas,
} from './scroll-stamp-into-canvas';
import { ensurePaginationNavLabels } from './section-ops';
import {
	getPostsPerPageMap,
	resolveControlViewStates,
	type ControlViewState,
} from './resolve-control-values';
import {
	resolveConfigVariantsHtml,
	type PatternRecord,
} from './resolve-variant-html';
import type {
	BlockNode,
	ControlDef,
	ControlValue,
	InnerOrderRule,
	ReorderElementsPayload,
	TemplateOptionsConfig,
} from './types';

export type { ControlViewState };

type TemplateRecord = {
	id?: string | number;
	slug?: string;
	content?: { raw?: string } | string;
	blocks?: BlockNode[];
};

type SiteRecord = {
	[TEMPLATE_SETTINGS_KEY]?: TemplateSettingsRecord | null;
};

function getContentRaw(record: TemplateRecord | undefined): string {
	if (!record) {
		return '';
	}
	if (typeof record.content === 'string') {
		return record.content;
	}
	return record.content?.raw || '';
}

function getBlocksFromRecord(record: TemplateRecord | undefined): BlockNode[] {
	if (!record) {
		return [];
	}
	if (Array.isArray(record.blocks) && record.blocks.length > 0) {
		return record.blocks as BlockNode[];
	}
	const raw = getContentRaw(record);
	return raw ? parseBlocks(raw) : [];
}

export default function useTemplateOptions(
	templateId: string | number | null,
	config: TemplateOptionsConfig,
	filterId: string
) {
	const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
	const [pendingAction, setPendingAction] = useState<null | (() => void)>(
		null
	);

	const { record, settings, isDirty, sitePostsPerPage } = useSelect(
		(select) => {
			const core = select(coreStore) as unknown as {
				getEditedEntityRecord: (
					kind: string,
					name: string,
					key?: string | number
				) =>
					| TemplateRecord
					| (SiteRecord & { posts_per_page?: number })
					| undefined;
				getEntityRecordEdits: (
					kind: string,
					name: string,
					key?: string | number
				) => Record<string, unknown> | null | undefined;
				hasEditsForEntityRecord: (
					kind: string,
					name: string,
					key?: string | number
				) => boolean;
			};

			const template = templateId
				? (core.getEditedEntityRecord(
						'postType',
						'wp_template',
						templateId
					) as TemplateRecord | undefined)
				: undefined;

			const site = core.getEditedEntityRecord('root', 'site') as
				(SiteRecord & { posts_per_page?: number }) | undefined;

			const templateDirty = templateId
				? core.hasEditsForEntityRecord(
						'postType',
						'wp_template',
						templateId
					)
				: false;
			// Preview-only posts_per_page edits (for inherited Query canvas)
			// should not keep Save enabled after template settings are persisted.
			const siteEdits = core.getEntityRecordEdits('root', 'site') || {};
			const siteEditKeys = Object.keys(siteEdits);
			const hasPersistableSiteEdits = siteEditKeys.some(
				(key) => key !== 'posts_per_page'
			);

			return {
				record: template,
				settings: site?.[TEMPLATE_SETTINGS_KEY] || {},
				sitePostsPerPage: Number(site?.posts_per_page) || 0,
				isDirty: templateDirty || hasPersistableSiteEdits,
			};
		},
		[templateId]
	);

	// Variant markup source: registered block patterns from the core store
	// (site editor usually has this resolved already; calling the selector
	// triggers the `/wp/v2/block-patterns/patterns` resolver otherwise).
	const { patterns, patternsResolved } = useSelect((select) => {
		const core = select(coreStore) as unknown as {
			getBlockPatterns: () => PatternRecord[] | undefined;
			hasFinishedResolution: (
				selectorName: string,
				args?: unknown[]
			) => boolean;
		};
		return {
			patterns: core.getBlockPatterns(),
			patternsResolved: core.hasFinishedResolution(
				'getBlockPatterns',
				[]
			),
		};
	}, []);

	const { editEntityRecord } = useDispatch(coreStore) as unknown as {
		editEntityRecord: (
			kind: string,
			name: string,
			key: string | number | undefined,
			edits: Record<string, unknown>
		) => void;
	};

	const blocks = useMemo(() => getBlocksFromRecord(record), [record]);

	const applyBlocks = useCallback(
		(next: BlockNode[]) => {
			if (!templateId) {
				return;
			}
			// Serialize → re-parse so canvas gets blocks with matching originalContent.
			const { blocks: freshBlocks, content } = toEntityEdits(next);
			editEntityRecord('postType', 'wp_template', templateId, {
				blocks: freshBlocks,
				content,
			});
		},
		[editEntityRecord, templateId]
	);

	const didEnsureNavLabels = useRef(false);
	useEffect(() => {
		if (!templateId || didEnsureNavLabels.current || !blocks.length) {
			return;
		}
		// One pass after the template tree is available. Do not re-walk on
		// later block edits — that would run two section lookups per change.
		const next = ensurePaginationNavLabels(blocks);
		didEnsureNavLabels.current = true;
		if (next !== blocks) {
			applyBlocks(next);
		}
	}, [applyBlocks, blocks, templateId]);

	const settingBucket = filterId || 'archive';

	// Inherited Query canvas reads Reading Settings posts_per_page. Keep it
	// aligned with the active template-options bucket while this panel is open.
	useEffect(() => {
		const map = getPostsPerPageMap(settings as TemplateSettingsRecord);
		const desired = Number(map[settingBucket]);
		if (!desired || desired === sitePostsPerPage) {
			return;
		}
		editEntityRecord('root', 'site', undefined, {
			posts_per_page: desired,
		});
	}, [editEntityRecord, settingBucket, settings, sitePostsPerPage]);

	// Config copy whose variants carry resolved HTML (pattern content /
	// generated template-part comments). Operations must never run against
	// a variant without html — while loading, pickers disable instead.
	const resolvedConfig = useMemo(
		() => resolveConfigVariantsHtml(config, patterns, patternsResolved),
		[config, patterns, patternsResolved]
	);

	const controlStates: ControlViewState[] = useMemo(
		() =>
			resolveControlViewStates(
				blocks,
				resolvedConfig,
				settings as TemplateSettingsRecord,
				settingBucket
			),
		[blocks, resolvedConfig, settings, settingBucket]
	);

	const runWithConfirm = useCallback(
		(needsConfirm: boolean, action: () => void) => {
			if (!needsConfirm) {
				action();
				return;
			}
			setConfirmMessage(
				__(
					'This template structure was customized. Continuing will rebuild the layout while keeping your content where possible. Continue?',
					'blockera'
				)
			);
			setPendingAction(() => action);
		},
		[]
	);

	const confirmPending = useCallback(() => {
		if (pendingAction) {
			pendingAction();
		}
		setPendingAction(null);
		setConfirmMessage(null);
	}, [pendingAction]);

	const cancelPending = useCallback(() => {
		setPendingAction(null);
		setConfirmMessage(null);
	}, []);

	const onChangeControl = useCallback(
		(control: ControlDef, nextValue: ControlValue) => {
			const view = controlStates.find((c) => c.control.id === control.id);
			const needsConfirm = !!view?.needsConfirm;
			// Callers may hold a control from the raw config (e.g. a group
			// header toggle) — always operate on the html-resolved copy.
			const resolvedControl = view?.control || control;

			const action = () => {
				const result = applyOperation({
					blocks,
					control: resolvedControl,
					nextValue,
					config: resolvedConfig,
					settings: settings as TemplateSettingsRecord,
					settingBucket,
					needsConfirm,
				});
				if (!result) {
					return;
				}
				if (result.kind === 'site-edits') {
					editEntityRecord('root', 'site', undefined, result.edits);
				} else {
					applyBlocks(result.blocks);
				}
				const revealId = resolveEnableScrollTarget(
					resolvedControl,
					nextValue
				);
				if (revealId) {
					// Presence-on often inserts a stamp that is already in
					// the lower viewport (e.g. pagination-numbers at ~680px).
					// The in-view skip would no-op; still land at 100px / page top.
					scrollStampIntoCanvas(revealId, {
						forceLand: isPresenceToggle(resolvedControl),
					});
				} else {
					// Presence-off: cancel a leftover observe so it cannot
					// re-scroll after the stamp is removed.
					cancelStampCanvasReveal();
				}
			};

			runWithConfirm(needsConfirm, action);
		},
		[
			applyBlocks,
			blocks,
			resolvedConfig,
			controlStates,
			editEntityRecord,
			runWithConfirm,
			settingBucket,
			settings,
		]
	);

	const onReorderElements = useCallback(
		(rule: InnerOrderRule, payload: ReorderElementsPayload) => {
			const result = applyOperation({
				blocks,
				control: {
					id: `reorder-${rule.parentId}`,
					type: 'button',
					label: '',
					target: { kind: 'section', id: rule.parentId },
					operation: 'reorderInnerSections',
					innerOrder: rule,
				},
				nextValue: payload as ControlValue,
				config: resolvedConfig,
				settings: settings as TemplateSettingsRecord,
				settingBucket,
				needsConfirm: false,
			});
			if (result?.kind === 'blocks') {
				applyBlocks(result.blocks);
				const revealId =
					!Array.isArray(payload) && payload.move
						? payload.move.toParentId
						: rule.parentId;
				scrollStampIntoCanvas(revealId);
			}
		},
		[applyBlocks, blocks, resolvedConfig, settingBucket, settings]
	);

	return {
		blocks,
		controlStates,
		isDirty,
		onChangeControl,
		onReorderElements,
		/** False while the patterns REST request is still in flight. */
		patternsReady: patternsResolved,
		confirmMessage,
		confirmPending,
		cancelPending,
		templateSlug: record?.slug || '',
	};
}
