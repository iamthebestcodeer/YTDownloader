import { type DownloadEngine, UnsupportedPlatformError } from "./download-engine";

function reject(): Promise<never> {
	return Promise.reject(new UnsupportedPlatformError());
}

/** Used where yt-dlp cannot run (iOS, web): every operation explains why it is unavailable. */
export const unsupportedEngine: DownloadEngine = {
	isSupported: false,
	initialize: () => Promise.resolve(),
	version: () => Promise.resolve(null),
	update: reject,
	fetchInfo: reject,
	search: reject,
	download: reject,
	stop: () => {},
	discard: () => {},
	openFile: () => {},
	onProgress: () => () => {},
};
