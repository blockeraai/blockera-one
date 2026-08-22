/**
 * Visit-wide session bag. Gutenberg renders route sidebars outside
 * EditorSessionProvider, so React context cannot own the store.
 */

import { createSessionBag, type EditorSessionApi } from './bag';

const listeners = new Set<() => void>();

function notify(): void {
	listeners.forEach((listener) => listener());
}

let bag: EditorSessionApi = createSessionBag(notify);

export function getVisitSession(): EditorSessionApi {
	return bag;
}

export function subscribeVisitSession(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function resetVisitSession(): void {
	bag = createSessionBag(notify);
	notify();
}
