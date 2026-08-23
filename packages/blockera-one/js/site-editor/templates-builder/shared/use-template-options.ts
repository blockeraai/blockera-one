/**
 * Bind a template options config to the edited entity (`wp_template` or
 * `wp_template_part`) + site settings. Thin React hook — pure logic lives
 * in `resolve-control-values.ts` (state resolution) and `ops/apply-operation.ts`
 * (operation dispatch).
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
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
	EMPTY_TEMPLATE_SETTINGS,
	TEMPLATE_SETTINGS_KEY,
	type TemplateSettingsRecord,
} from './constants';
import { applyOperation } from './ops/apply-operation';
import type { LocalReplace } from './ops/local-replace';
import { runBroadcast } from './ops/broadcast';
import {
	sessionEntityKey,
	sessionOrderKeyForRule,
	useEditorSession,
} from '../../session';
import {
	isPresenceToggle,
	resolveEnableScrollTarget,
} from './resolve/resolve-options-panel';
import {
	cancelStampCanvasReveal,
	scrollStampIntoCanvas,
} from './canvas/scroll-stamp-into-canvas';
import { ensurePaginationNavLabels } from './section-ops';
import {
	getPostsPerPageMap,
	resolveControlViewStates,
	type ControlViewState,
} from './resolve/resolve-control-values';
import {
	resolveConfigVariantsHtml,
	type PatternRecord,
} from './resolve/resolve-variant-html';
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

function runRegistryBatch<T>(
	registry: { batch?: (callback: () => void) => void },
	run: () => T
): T {
	let result: T;
	if (typeof registry.batch === 'function') {
		registry.batch(() => {
			result = run();
		});
	} else {
		result = run();
	}
	return result!;
}

function hydrateInnerFromStore(
	getBlock: (clientId: string) => unknown,
	nextChildren: BlockNode[]
): BlockNode[] | null {
	const out: BlockNode[] = [];
	for (let i = 0; i < nextChildren.length; i++) {
		const child = nextChildren[i];
		const liveChild = child.clientId
			? (getBlock(child.clientId) as BlockNode | undefined)
			: undefined;
		if (liveChild) {
			out.push(liveChild);
			continue;
		}
		const parsed = toEntityEdits([child]).blocks;
		if (!parsed.length) {
			return null;
		}
		out.push(parsed[0]);
	}
	return out;
}

export default function useTemplateOptions(
	templateId: string | number | null,
	config: TemplateOptionsConfig,
	filterId: string
) {
	const entityPostType = config.entityPostType || 'wp_template';
	const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
	const [pendingAction, setPendingAction] = useState<null | (() => void)>(
		null
	);
	const session = useEditorSession();

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
						entityPostType,
						templateId
					) as TemplateRecord | undefined)
				: undefined;

			const site = core.getEditedEntityRecord('root', 'site') as
				(SiteRecord & { posts_per_page?: number }) | undefined;

			const templateDirty = templateId
				? core.hasEditsForEntityRecord(
						'postType',
						entityPostType,
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
				settings:
					site?.[TEMPLATE_SETTINGS_KEY] || EMPTY_TEMPLATE_SETTINGS,
				sitePostsPerPage: Number(site?.posts_per_page) || 0,
				isDirty: templateDirty || hasPersistableSiteEdits,
			};
		},
		[entityPostType, templateId]
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

	const registry = useRegistry();

	const { selectedClientId, canvasBlocks } = useSelect((select) => {
		const editor = select(blockEditorStore) as unknown as {
			getSelectedBlockClientId?: () => string | null;
			getBlocks?: (rootClientId?: string | null) => BlockNode[];
		};
		return {
			selectedClientId: editor.getSelectedBlockClientId?.() || null,
			canvasBlocks:
				typeof editor.getBlocks === 'function'
					? editor.getBlocks() || []
					: [],
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

	const entityBlocks = useMemo(() => getBlocksFromRecord(record), [record]);
	// Clean load has template `content` only. `parse()` mints new clientIds that
	// are not in the canvas store, so local replace/reorder would reset the tree.
	const blocks = canvasBlocks.length > 0 ? canvasBlocks : entityBlocks;
	const entityKey = sessionEntityKey(
		entityPostType,
		templateId,
		record?.slug
	);

	const applyBlocks = useCallback(
		(next: BlockNode[]) => {
			if (!templateId) {
				return;
			}
			// Serialize → re-parse so canvas gets blocks with matching originalContent.
			const { blocks: freshBlocks, content } = toEntityEdits(next);
			editEntityRecord('postType', entityPostType, templateId, {
				blocks: freshBlocks,
				content,
			});
		},
		[editEntityRecord, entityPostType, templateId]
	);

	const applyLocalReplace = useCallback(
		(localReplace: LocalReplace | undefined): boolean => {
			const isRemoveOnly =
				!!localReplace?.clientId &&
				(localReplace.blocks?.length || 0) === 0;
			const isReorderOnly =
				typeof localReplace?.reorderParentClientId === 'string';
			const isAttributePatch =
				(localReplace?.attributeUpdates?.length || 0) > 0;
			const isInnerPatch = (localReplace?.innerPatches?.length || 0) > 0;
			const isInsertOnly =
				!!localReplace &&
				!isReorderOnly &&
				!isAttributePatch &&
				!isInnerPatch &&
				!localReplace.clientId &&
				(localReplace.blocks?.length || 0) > 0;
			const isSwapOrMove =
				!!localReplace?.clientId &&
				(localReplace.blocks?.length || 0) > 0;
			if (
				!localReplace ||
				(!isRemoveOnly &&
					!isInsertOnly &&
					!isSwapOrMove &&
					!isReorderOnly &&
					!isAttributePatch &&
					!isInnerPatch)
			) {
				return false;
			}
			const editor = registry.select(blockEditorStore) as unknown as {
				getBlock?: (clientId: string) => unknown;
				getBlockRootClientId?: (clientId: string) => string | null;
				getBlocks?: (rootClientId?: string | null) => BlockNode[];
			};
			if (typeof editor.getBlock !== 'function') {
				return false;
			}
			if (isInnerPatch) {
				const patches = localReplace.innerPatches || [];
				for (let i = 0; i < patches.length; i++) {
					if (!editor.getBlock(patches[i].clientId)) {
						return false;
					}
				}
				const dispatchEditor = registry.dispatch(
					blockEditorStore
				) as unknown as {
					updateBlockAttributes?: (
						clientId: string | string[],
						attributes: Record<string, unknown>
					) => void;
					replaceInnerBlocks?: (
						rootClientId: string,
						blocks: BlockNode[],
						updateSelection?: boolean
					) => void;
				};
				if (
					typeof dispatchEditor.replaceInnerBlocks !== 'function' &&
					patches.some((item) => item.innerBlocks)
				) {
					return false;
				}
				const planned: Array<{
					clientId: string;
					innerBlocks?: BlockNode[];
					attributes?: Record<string, unknown>;
				}> = [];
				for (let i = 0; i < patches.length; i++) {
					const patch = patches[i];
					if (!patch.innerBlocks) {
						planned.push(patch);
						continue;
					}
					const hydrated = hydrateInnerFromStore(
						editor.getBlock,
						patch.innerBlocks
					);
					if (!hydrated) {
						return false;
					}
					planned.push({
						clientId: patch.clientId,
						innerBlocks: hydrated,
						attributes: patch.attributes,
					});
				}
				runRegistryBatch(registry, () => {
					for (let i = 0; i < planned.length; i++) {
						const patch = planned[i];
						if (
							patch.attributes &&
							typeof dispatchEditor.updateBlockAttributes ===
								'function'
						) {
							dispatchEditor.updateBlockAttributes(
								patch.clientId,
								patch.attributes
							);
						}
						if (!patch.innerBlocks) {
							continue;
						}
						dispatchEditor.replaceInnerBlocks(
							patch.clientId,
							patch.innerBlocks,
							false
						);
					}
				});
				return true;
			}
			if (isAttributePatch) {
				const updates = localReplace.attributeUpdates || [];
				for (let i = 0; i < updates.length; i++) {
					if (!editor.getBlock(updates[i].clientId)) {
						return false;
					}
				}
				const dispatchEditor = registry.dispatch(
					blockEditorStore
				) as unknown as {
					updateBlockAttributes?: (
						clientId: string | string[],
						attributes: Record<string, unknown>
					) => void;
				};
				if (
					typeof dispatchEditor.updateBlockAttributes !== 'function'
				) {
					return false;
				}
				runRegistryBatch(registry, () => {
					for (let i = 0; i < updates.length; i++) {
						dispatchEditor.updateBlockAttributes(
							updates[i].clientId,
							updates[i].attributes
						);
					}
				});
				return true;
			}
			if (
				isReorderOnly &&
				localReplace.reorderParentClientId &&
				!editor.getBlock(localReplace.reorderParentClientId)
			) {
				return false;
			}
			if (
				!isInsertOnly &&
				!isReorderOnly &&
				!editor.getBlock(localReplace.clientId || '')
			) {
				return false;
			}
			let fresh: BlockNode[] = [];
			if (!isRemoveOnly && !isReorderOnly) {
				const parsed = toEntityEdits(localReplace.blocks);
				fresh = parsed.blocks;
				if (!fresh.length) {
					return false;
				}
			}
			let fromParentClientId = '';
			if (
				!isInsertOnly &&
				typeof editor.getBlockRootClientId === 'function'
			) {
				fromParentClientId =
					editor.getBlockRootClientId(localReplace.clientId || '') ||
					'';
			}
			const destParentClientId =
				typeof localReplace.destParentClientId === 'string'
					? localReplace.destParentClientId
					: fromParentClientId;
			const destIndex =
				typeof localReplace.destIndex === 'number'
					? localReplace.destIndex
					: null;
			const isRelocate = destParentClientId !== fromParentClientId;
			if (typeof editor.getBlocks !== 'function') {
				return false;
			}
			if (
				(isInsertOnly || isRelocate) &&
				destParentClientId &&
				!editor.getBlock(destParentClientId)
			) {
				return false;
			}
			const dispatchEditor = registry.dispatch(
				blockEditorStore
			) as unknown as {
				replaceInnerBlocks?: (
					rootClientId: string,
					blocks: BlockNode[],
					updateSelection?: boolean
				) => void;
			};
			if (typeof dispatchEditor.replaceInnerBlocks !== 'function') {
				return false;
			}
			const run = () => {
				if (isReorderOnly) {
					const parentId = localReplace.reorderParentClientId || '';
					const live = editor.getBlocks(parentId) || [];
					const byId = new Map<string, BlockNode>();
					for (let i = 0; i < live.length; i++) {
						const id = live[i].clientId;
						if (id) {
							byId.set(id, live[i]);
						}
					}
					const ordered: BlockNode[] = [];
					for (let i = 0; i < localReplace.blocks.length; i++) {
						const id = localReplace.blocks[i].clientId;
						const liveBlock = id ? byId.get(id) : undefined;
						if (!liveBlock) {
							return false;
						}
						ordered.push(liveBlock);
					}
					if (ordered.length !== live.length) {
						return false;
					}
					dispatchEditor.replaceInnerBlocks(parentId, ordered, false);
					return true;
				}
				if (isInsertOnly) {
					const destSiblings =
						editor.getBlocks(destParentClientId) || [];
					const insertAt = Math.max(
						0,
						Math.min(
							destIndex ?? destSiblings.length,
							destSiblings.length
						)
					);
					dispatchEditor.replaceInnerBlocks(
						destParentClientId,
						[
							...destSiblings.slice(0, insertAt),
							...fresh,
							...destSiblings.slice(insertAt),
						],
						false
					);
					return true;
				}
				const fromSiblings = editor.getBlocks(fromParentClientId) || [];
				const fromIndex = fromSiblings.findIndex(
					(block) => block.clientId === localReplace.clientId
				);
				if (fromIndex < 0) {
					return false;
				}
				if (isRemoveOnly) {
					dispatchEditor.replaceInnerBlocks(
						fromParentClientId,
						[
							...fromSiblings.slice(0, fromIndex),
							...fromSiblings.slice(fromIndex + 1),
						],
						false
					);
					return true;
				}
				if (!isRelocate) {
					dispatchEditor.replaceInnerBlocks(
						fromParentClientId,
						[
							...fromSiblings.slice(0, fromIndex),
							...fresh,
							...fromSiblings.slice(fromIndex + 1),
						],
						false
					);
					return true;
				}
				dispatchEditor.replaceInnerBlocks(
					fromParentClientId,
					fromSiblings.filter(
						(block) => block.clientId !== localReplace.clientId
					),
					false
				);
				const destSiblings = editor.getBlocks(destParentClientId) || [];
				const insertAt = Math.max(
					0,
					Math.min(
						destIndex ?? destSiblings.length,
						destSiblings.length
					)
				);
				dispatchEditor.replaceInnerBlocks(
					destParentClientId,
					[
						...destSiblings.slice(0, insertAt),
						...fresh,
						...destSiblings.slice(insertAt),
					],
					false
				);
				return true;
			};
			return runRegistryBatch(registry, run);
		},
		[registry]
	);

	const didEnsureNavLabels = useRef(false);
	useEffect(() => {
		if (
			entityPostType !== 'wp_template' ||
			!templateId ||
			didEnsureNavLabels.current ||
			!blocks.length
		) {
			return;
		}
		// One pass after the template tree is available. Do not re-walk on
		// later block edits — that would run two section lookups per change.
		const next = ensurePaginationNavLabels(blocks);
		didEnsureNavLabels.current = true;
		if (next !== blocks) {
			applyBlocks(next);
		}
	}, [applyBlocks, blocks, entityPostType, templateId]);

	const settingBucket = filterId || 'archive';

	// Inherited Query canvas reads Reading Settings posts_per_page. Keep it
	// aligned with the active template-options bucket while this panel is open.
	useEffect(() => {
		if (entityPostType !== 'wp_template') {
			return;
		}
		const map = getPostsPerPageMap(settings as TemplateSettingsRecord);
		const desired = Number(map[settingBucket]);
		if (!desired || desired === sitePostsPerPage) {
			return;
		}
		editEntityRecord('root', 'site', undefined, {
			posts_per_page: desired,
		});
	}, [
		editEntityRecord,
		entityPostType,
		settingBucket,
		settings,
		sitePostsPerPage,
	]);

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
				settingBucket,
				selectedClientId
			),
		[blocks, resolvedConfig, settings, settingBucket, selectedClientId]
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
					selectedClientId,
					orderBuckets: resolvedControl.innerOrder
						? session.get(
								sessionOrderKeyForRule(
									entityKey,
									resolvedControl.innerOrder
								)
							)
						: undefined,
					session,
					entityKey,
					entityDirty: isDirty,
				});
				if (!result) {
					return;
				}
				if (result.kind === 'site-edits') {
					editEntityRecord('root', 'site', undefined, result.edits);
				} else if (result.kind === 'broadcast') {
					runBroadcast(result);
				} else if (!applyLocalReplace(result.localReplace)) {
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
			applyLocalReplace,
			blocks,
			resolvedConfig,
			controlStates,
			editEntityRecord,
			runWithConfirm,
			settingBucket,
			settings,
			selectedClientId,
			session,
			entityKey,
			isDirty,
		]
	);

	const onReorderElements = useCallback(
		(rule: InnerOrderRule, payload: ReorderElementsPayload) => {
			const result = applyOperation({
				blocks,
				control: {
					id: `reorder-${rule.parentId}`,
					type: 'button',
					target: { kind: 'section', id: rule.parentId },
					operation: 'reorderInnerSections',
					innerOrder: rule,
				},
				nextValue: payload as ControlValue,
				config: resolvedConfig,
				settings: settings as TemplateSettingsRecord,
				settingBucket,
				needsConfirm: false,
				selectedClientId,
				session,
				entityKey,
			});
			if (result?.kind === 'blocks') {
				if (result.localReplace) {
					if (!applyLocalReplace(result.localReplace)) {
						applyBlocks(result.blocks);
					}
				} else {
					applyBlocks(result.blocks);
				}
				const revealId =
					!Array.isArray(payload) && payload.move
						? payload.move.toParentId
						: rule.parentId;
				scrollStampIntoCanvas(revealId);
			}
		},
		[
			applyBlocks,
			applyLocalReplace,
			blocks,
			resolvedConfig,
			settingBucket,
			settings,
			selectedClientId,
			session,
			entityKey,
		]
	);

	return {
		blocks,
		controlStates,
		isDirty,
		onChangeControl,
		onReorderElements,
		confirmMessage,
		confirmPending,
		cancelPending,
		templateSlug: record?.slug || '',
		entityKey,
		session,
	};
}
