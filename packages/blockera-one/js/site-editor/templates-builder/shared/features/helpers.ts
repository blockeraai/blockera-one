/**
 * Shared options bag for feature factories. Call sites configure inspector
 * extras without spreading a ControlDef. Identity fields (id, type, target,
 * operation, attributePath) stay on the feature.
 */

import type { ControlDef } from '../types';

export type FeatureTarget = ControlDef['target'];

export type FeatureOptions = Omit<
	Partial<ControlDef>,
	'id' | 'type' | 'target' | 'operation' | 'attributePath'
>;

export function withFeatureOptions(
	def: ControlDef,
	options?: FeatureOptions
): ControlDef {
	if (!options) {
		return def;
	}
	const extras: Partial<ControlDef> = {};
	for (const key of Object.keys(options) as Array<keyof FeatureOptions>) {
		const value = options[key];
		if (value !== undefined) {
			(extras as Record<string, unknown>)[key] = value;
		}
	}
	return { ...def, ...extras };
}
