/**
 * List item without an extra wrapper: key + optional separator class go on
 * the control root (BaseControl / GatewayRow). Walk through
 * ControlContextProvider so className lands on the actual field.
 */

import type { ReactElement } from 'react';

import { cloneElement, isValidElement } from '@wordpress/element';

/**
 * Blockera dependencies
 */
import { classNames } from '@blockera/classnames';
import { ControlContextProvider } from '@blockera/controls';

type ControlRootProps = {
	className?: string;
	children?: unknown;
};

export function asControlListItem(
	controlNode: ReactElement<ControlRootProps>,
	id: string,
	separatorBefore?: boolean
): ReactElement {
	if (!separatorBefore) {
		return cloneElement(controlNode, { key: id });
	}

	const extraClass = 'has-separator-before';

	if (
		controlNode.type === ControlContextProvider &&
		isValidElement<ControlRootProps>(controlNode.props.children)
	) {
		const child = controlNode.props.children;
		return cloneElement(
			controlNode,
			{ key: id },
			cloneElement(child, {
				className: classNames(child.props.className, extraClass),
			})
		);
	}

	return cloneElement(controlNode, {
		key: id,
		className: classNames(controlNode.props.className, extraClass),
	});
}
