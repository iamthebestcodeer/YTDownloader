import type { YtDlpNativeModule } from "@/modules/yt-dlp";
import { buildDownloadArgs, buildInfoArgs, buildSearchRequest } from "@/src/domain/download-args";
import { parseMediaInfo, parseSearchResults } from "@/src/domain/media-info";

import type { DownloadEngine } from "./download-engine";

const SEARCH_RESULT_LIMIT = 20;

/** Runs yt-dlp on the device through the local `YtDlp` Expo module. */
export function createNativeEngine(native: YtDlpNativeModule): DownloadEngine {
	return {
		isSupported: true,
		initialize: () => native.initialize(),
		version: () => native.getVersion(),
		update: () => native.update(),

		async fetchInfo(url) {
			const json = await native.dumpJson(url, buildInfoArgs());
			return parseMediaInfo(json, url);
		},

		async search(query) {
			const { target, args } = buildSearchRequest(query, SEARCH_RESULT_LIMIT);
			return parseSearchResults(await native.dumpJson(target, args));
		},

		download: ({ jobId, url, options }) =>
			native.startDownload(jobId, url, buildDownloadArgs(options)),
		stop: (jobId) => void native.stopDownload(jobId),
		discard: (jobId) => void native.discardDownload(jobId),
		openFile: (file) => native.openFile(file.uri, file.mimeType),

		onProgress(listener) {
			const subscription = native.addListener("onProgress", listener);
			return () => subscription.remove();
		},
	};
}
