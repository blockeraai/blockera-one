/**
 * In-memory session bag. Sync get/set so applyOperation can read after write.
 */

export type EditorSessionApi = {
	get: <T>(key: string) => T | undefined;
	set: <T>(key: string, value: T) => void;
	ensure: <T>(key: string, value: T) => void;
	delete: (key: string) => void;
};

function cloneValue<T>(value: T): T {
	if (value === undefined) {
		return value;
	}
	return JSON.parse(JSON.stringify(value)) as T;
}

export function createSessionBag(
	onChange?: (store: Record<string, unknown>) => void
): EditorSessionApi {
	let store: Record<string, unknown> = {};

	return {
		get<T>(key: string): T | undefined {
			if (!Object.prototype.hasOwnProperty.call(store, key)) {
				return undefined;
			}
			return cloneValue(store[key] as T);
		},
		set<T>(key: string, value: T): void {
			store = { ...store, [key]: cloneValue(value) };
			onChange?.(store);
		},
		ensure<T>(key: string, value: T): void {
			if (Object.prototype.hasOwnProperty.call(store, key)) {
				return;
			}
			store = { ...store, [key]: cloneValue(value) };
			onChange?.(store);
		},
		delete(key: string): void {
			if (!Object.prototype.hasOwnProperty.call(store, key)) {
				return;
			}
			const next = { ...store };
			delete next[key];
			store = next;
			onChange?.(store);
		},
	};
}

export const noopSession: EditorSessionApi = {
	get: () => undefined,
	set: () => undefined,
	ensure: () => undefined,
	delete: () => undefined,
};
