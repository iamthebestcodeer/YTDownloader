import playlistFixture from "@/src/domain/__fixtures__/playlist.json";
import searchFixture from "@/src/domain/__fixtures__/search.json";
import videoFixture from "@/src/domain/__fixtures__/video.json";
import { parseMediaInfo, parseSearchResults } from "@/src/domain/media-info";
import { isVideoInsidePlaylist } from "@/src/domain/url";

import type { DownloadEngine, EngineProgress } from "./download-engine";

const TICK_MS = 400;
const PERCENT_PER_TICK = 7;
const PREVIEW_FILE_BYTES = 48_000_000;

/**
 * Simulated engine for developing the UI in a web browser, where yt-dlp cannot run.
 * It answers with recorded yt-dlp output and fakes download progress.
 */
type Simulation = {
	timer: ReturnType<typeof setInterval>;
	reject: (error: Error) => void;
};

export function createPreviewEngine(): DownloadEngine {
	const listeners = new Set<(progress: EngineProgress) => void>();
	const simulations = new Map<string, Simulation>();
	const emit = (progress: EngineProgress) => {
		for (const listener of listeners) listener(progress);
	};

	return {
		isSupported: true,
		initialize: () => Promise.resolve(),
		version: () => Promise.resolve("preview"),
		update: () => Promise.resolve("up-to-date"),

		fetchInfo: async (url) => {
			const isPlaylist = url.includes("list=") && !isVideoInsidePlaylist(url);
			const fixture = isPlaylist ? playlistFixture : videoFixture;
			return parseMediaInfo(JSON.stringify(fixture), url);
		},

		search: async () => parseSearchResults(JSON.stringify(searchFixture)),

		download: ({ jobId, options }) =>
			new Promise((resolve, reject) => {
				let percent = 0;
				const timer = setInterval(() => {
					percent = Math.min(100, percent + PERCENT_PER_TICK);
					emit({
						jobId,
						percent,
						etaSeconds: (100 - percent) / 5,
						line: "[download] at 2.40MiB/s",
					});
					if (percent < 100) return;
					clearInterval(timer);
					simulations.delete(jobId);
					const extension = options.kind === "audio" ? options.audioFormat : options.videoContainer;
					resolve([
						{
							uri: "preview://file",
							name: `preview.${extension}`,
							mimeType: "video/mp4",
							sizeBytes: PREVIEW_FILE_BYTES,
						},
					]);
				}, TICK_MS);
				simulations.set(jobId, { timer, reject });
			}),

		stop: (jobId) => {
			const simulation = simulations.get(jobId);
			if (!simulation) return;
			clearInterval(simulation.timer);
			simulations.delete(jobId);
			simulation.reject(new Error("Stopped"));
		},

		discard: () => {},
		openFile: () => {},

		onProgress: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}
