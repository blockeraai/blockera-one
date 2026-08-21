/**
 * Shared BlockNode factories for templates-builder unit specs.
 */

import { findByStamp } from '../../tree';

export function block(name, attributes = {}, innerBlocks = []) {
	return { name, attributes, innerBlocks };
}

export function stamped(name, stampValue, attributes = {}, innerBlocks = []) {
	if (Array.isArray(attributes)) {
		innerBlocks = attributes;
		attributes = {};
	}
	const { metadata, clientId, ...rest } = attributes;
	const node = block(
		name,
		{
			...rest,
			metadata: { ...(metadata || {}), blockeraOne: stampValue },
		},
		innerBlocks
	);
	if (clientId !== undefined) {
		node.clientId = clientId;
	}
	return node;
}

export function row(innerBlocks, id = 'post-meta') {
	return stamped('core/group', `section/${id}:default`, {}, innerBlocks);
}

export function findStamp(blocks, id) {
	return findByStamp(blocks, (stamp) => stamp?.id === id);
}
