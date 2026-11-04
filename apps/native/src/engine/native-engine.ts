import type { YtDlpNativeModule } from "@/modules/yt-dlp";
import { buildDownloadArgs, buildInfoArgs, buildSearchRequest } from "@/src/domain/download-args";
import { parseMediaInfo, parseSearchResults } from "@/src/domain/media-info";
import type { MediaInfo } from "@/src/domain/types";
import { isYoutubeUrl } from "@/src/domain/url";

import { ClientRotation } from "./client-rotation";
import type { DownloadEngine } from "./download-engine";

const SEARCH_RESULT_LIMIT = 20;

/** Runs yt-dlp on the device through the local `YtDlp` Expo module. */
export function createNativeEngine(native: YtDlpNativeModule): DownloadEngine {
	const rotation = new ClientRotation();

	/** YouTube calls rotate through player clients; other sites run once as-is. */
	const run = <Result>(
		url: string,
		attempt: (clientArgs: string[]) => Promise<Result>,
		isComplete?: (result: Result) => boolean,
	) => (isYoutubeUrl(url) ? rotation.run(attempt, isComplete) : attempt([]));

	return {
		isSupported: true,
		initialize: () => native.initialize(),
		version: () => native.getVersion(),
		update: () => native.update(),

		fetchInfo: (url) =>
			run(
				url,
				async (clientArgs) =>
					parseMediaInfo(await native.dumpJson(url, [...buildInfoArgs(), ...clientArgs]), url),
				hasDownloadableFormats,
			),

		search(query) {
			const { target, args } = buildSearchRequest(query, SEARCH_RESULT_LIMIT);
			return rotation.run(async (clientArgs) =>
				parseSearchResults(await native.dumpJson(target, [...args, ...clientArgs])),
			);
		},

		download: ({ jobId, url, options }) =>
			run(url, (clientArgs) =>
				native.startDownload(jobId, url, [...buildDownloadArgs(options), ...clientArgs]),
			),

		stop: (jobId) => void native.stopDownload(jobId),
		discard: (jobId) => void native.discardDownload(jobId),
		openFile: (file) => native.openFile(file.uri, file.mimeType),

		onProgress(listener) {
			const subscription = native.addListener("onProgress", listener);
			return () => subscription.remove();
		},
	};
}

/** A client that only returns metadata leaves nothing but "Best" to choose from. */
function hasDownloadableFormats(info: MediaInfo): boolean {
	return info.kind === "playlist" || info.qualities.length > 1;
}
