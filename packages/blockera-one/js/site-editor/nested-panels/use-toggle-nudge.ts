/**
 * Restartable CSS nudge for an off-state FormToggle thumb.
 * Used when a disabled gateway is clicked instead of opening a nested panel.
 */

import type { AnimationEvent } from 'react';
import { useCallback, useEffect, useState } from '@wordpress/element';

const NUDGE_ANIMATION = 'blockera-gateway-toggle-nudge';
const NUDGE_MS = 400;

export default function useToggleNudge() {
	const [isNudging, setIsNudging] = useState(false);

	useEffect(() => {
		if (!isNudging) {
			return;
		}

		// Fallback when animationend does not fire (prefers-reduced-motion).
		const timer = window.setTimeout(() => {
			setIsNudging(false);
		}, NUDGE_MS);

		return () => {
			window.clearTimeout(timer);
		};
	}, [isNudging]);

	const nudge = useCallback(() => {
		setIsNudging(false);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setIsNudging(true);
			});
		});
	}, []);

	const onNudgeAnimationEnd = useCallback(
		(event: AnimationEvent<HTMLElement>) => {
			if (event.animationName === NUDGE_ANIMATION) {
				setIsNudging(false);
			}
		},
		[]
	);

	return { isNudging, nudge, onNudgeAnimationEnd };
}
