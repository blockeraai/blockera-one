/**
 * Fresh editor ids when restoring a parked subtree into the live document.
 */

import { hasBlockeraExtensionAttributes } from '../templates-builder/shared/blockera-attribute';
import type { BlockNode } from '../templates-builder/shared/types';

const BLOCKERA_UNIQUE_CLASS = /^blockera-block-[\w-]+$/i;

let seq = 0;

export function newSessionBlockId(): string {
	seq += 1;
	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.randomUUID === 'function'
	) {
		return crypto.randomUUID();
	}
	return `bo-session-${Date.now()}-${seq}`;
}

function remapClassName(className: unknown, nextId: string): unknown {
	if (typeof className !== 'string' || !className) {
		return className;
	}
	const tokens = className.split(/\s+/).filter(Boolean);
	const next: string[] = [];
	let replacedUnique = false;
	for (let i = 0; i < tokens.length; i++) {
		if (
			BLOCKERA_UNIQUE_CLASS.test(tokens[i]) &&
			tokens[i] !== 'blockera-block'
		) {
			next.push(`blockera-block-${nextId}`);
			replacedUnique = true;
		} else {
			next.push(tokens[i]);
		}
	}
	if (!replacedUnique && tokens.indexOf('blockera-block') !== -1) {
		next.push(`blockera-block-${nextId}`);
	}
	return next.join(' ');
}

export function remapVolatileIds(blocks: BlockNode[]): BlockNode[] {
	return blocks.map((block) => remapNode(block));
}

function remapNode(block: BlockNode): BlockNode {
	const nextId = newSessionBlockId();
	const attributes = { ...(block.attributes || {}) };
	const hasExtensions = hasBlockeraExtensionAttributes(
		attributes,
		block.name
	);
	if (hasExtensions) {
		attributes.blockeraId = nextId;
		delete attributes.blockeraPropsId;
		delete attributes.blockeraCompatId;
	} else {
		delete attributes.blockeraId;
		delete attributes.blockeraPropsId;
		delete attributes.blockeraCompatId;
	}
	if (attributes.className !== undefined) {
		attributes.className = remapClassName(attributes.className, nextId);
	}
	return {
		...block,
		clientId: nextId,
		attributes,
		innerBlocks: remapVolatileIds(block.innerBlocks || []),
	};
}
