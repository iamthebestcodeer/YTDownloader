type PersistedStore = {
	persist: {
		hasHydrated: () => boolean;
		onFinishHydration: (listener: () => void) => () => void;
	};
};

/** Resolves once every store has loaded its saved state from storage. */
export function waitForHydration(...stores: PersistedStore[]): Promise<void> {
	return Promise.all(stores.map(hydrationOf)).then(() => undefined);
}

function hydrationOf(store: PersistedStore): Promise<void> {
	if (store.persist.hasHydrated()) return Promise.resolve();
	return new Promise((resolve) => {
		const unsubscribe = store.persist.onFinishHydration(() => {
			unsubscribe();
			resolve();
		});
	});
}
