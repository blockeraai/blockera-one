/**
 * Shared GatewayRow props for sortable rows, group-body gateways,
 * type:gateway, and toggle+nestedPanel.
 */

import type { ReactNode } from 'react';

import type { GatewayRowProps } from '../../../nested-panels';

export type BuildGatewayRowPropsArgs = {
	title: string;
	nestedPanelId: string;
	enabled: boolean;
	onOpenNested?: (panelId: string) => void;
	toggle?: GatewayRowProps['toggle'];
	dragHandle?: ReactNode;
	isDragging?: boolean;
};

export function buildGatewayRowProps({
	title,
	nestedPanelId,
	enabled,
	onOpenNested,
	toggle,
	dragHandle,
	isDragging,
}: BuildGatewayRowPropsArgs): GatewayRowProps {
	const props: GatewayRowProps = {
		title,
		enabled,
		'data-test': `blockera-templates-builder-gateway-${nestedPanelId}`,
		onOpen: onOpenNested ? () => onOpenNested(nestedPanelId) : undefined,
	};

	if (toggle) {
		props.toggle = toggle;
	}
	if (dragHandle !== undefined) {
		props.dragHandle = dragHandle;
	}
	if (isDragging !== undefined) {
		props.isDragging = isDragging;
	}

	return props;
}
