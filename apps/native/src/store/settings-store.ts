import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { DownloadOptions } from "@/src/domain/types";

import { persistentStorage } from "./storage";

export type ThemePreference = "system" | "light" | "dark";

/** Download options a user picks once and reuses; playlist inclusion is decided per link. */
export type DefaultDownloadOptions = Omit<DownloadOptions, "includePlaylist">;

export const MAX_CONCURRENT_DOWNLOADS_LIMIT = 3;

type SettingsState = {
	defaults: DefaultDownloadOptions;
	maxConcurrentDownloads: number;
	theme: ThemePreference;
	updateDefaults: (changes: Partial<DefaultDownloadOptions>) => void;
	setMaxConcurrentDownloads: (count: number) => void;
	setTheme: (theme: ThemePreference) => void;
};

export const INITIAL_DEFAULTS: DefaultDownloadOptions = {
	kind: "video",
	videoQuality: 1080,
	videoContainer: "mp4",
	audioFormat: "mp3",
	embedThumbnail: true,
	embedMetadata: true,
	embedSubtitles: false,
	subtitleLanguages: "en.*",
};

export const useSettingsStore = create<SettingsState>()(
	persist(
		(set) => ({
			defaults: INITIAL_DEFAULTS,
			maxConcurrentDownloads: 2,
			theme: "system",
			updateDefaults: (changes) =>
				set((state) => ({ defaults: { ...state.defaults, ...changes } })),
			setMaxConcurrentDownloads: (count) =>
				set({
					maxConcurrentDownloads: Math.min(
						MAX_CONCURRENT_DOWNLOADS_LIMIT,
						Math.max(1, Math.round(count)),
					),
				}),
			setTheme: (theme) => set({ theme }),
		}),
		{
			name: "settings",
			version: 1,
			storage: persistentStorage,
			merge: (persisted, current) => {
				const saved = (persisted ?? {}) as Partial<SettingsState>;
				return {
					...current,
					...saved,
					defaults: { ...INITIAL_DEFAULTS, ...saved.defaults },
				};
			},
		},
	),
);
