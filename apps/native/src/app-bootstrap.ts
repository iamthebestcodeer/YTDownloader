import { useEffect } from "react";
import { Uniwind } from "uniwind";

import { engine } from "./engine";
import { useDownloadsStore } from "./store/downloads-store";
import { waitForHydration } from "./store/hydration";
import { downloadQueue } from "./store/queue";
import { useSettingsStore } from "./store/settings-store";

/** Starts the long-lived services the app relies on. Call once from the root layout. */
export function useAppBootstrap(): void {
	const theme = useSettingsStore((store) => store.theme);

	useEffect(() => {
		Uniwind.setTheme(theme);
	}, [theme]);

	useEffect(() => {
		void engine.initialize().catch(() => {
			// Initialization is retried lazily by every engine call, which reports the error.
		});
		// Saved jobs and the saved concurrency limit must both be loaded before anything starts.
		let stopQueue: (() => void) | undefined;
		let isUnmounted = false;
		void waitForHydration(useDownloadsStore, useSettingsStore).then(() => {
			if (!isUnmounted) stopQueue = downloadQueue.start();
		});
		return () => {
			isUnmounted = true;
			stopQueue?.();
		};
	}, []);
}
