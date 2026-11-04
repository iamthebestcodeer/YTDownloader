import type { DownloadedFile, DownloadOptions, MediaInfo, VideoSummary } from "@/src/domain/types";

export type EngineProgress = {
	jobId: string;
	percent: number;
	etaSeconds: number;
	line: string;
};

export type DownloadRequest = {
	jobId: string;
	url: string;
	options: DownloadOptions;
};

export type Unsubscribe = () => void;

/** Everything the app needs from yt-dlp, independent of how it is run. */
export interface DownloadEngine {
	readonly isSupported: boolean;
	initialize(): Promise<void>;
	version(): Promise<string | null>;
	update(): Promise<"updated" | "up-to-date">;
	fetchInfo(url: string): Promise<MediaInfo>;
	search(query: string): Promise<VideoSummary[]>;
	download(request: DownloadRequest): Promise<DownloadedFile[]>;
	stop(jobId: string): void;
	discard(jobId: string): void;
	openFile(file: DownloadedFile): void;
	onProgress(listener: (progress: EngineProgress) => void): Unsubscribe;
}

export class UnsupportedPlatformError extends Error {
	constructor() {
		super("Downloading is only available in the Android app.");
		this.name = "UnsupportedPlatformError";
	}
}

export class DownloadStoppedError extends Error {
	constructor() {
		super("The download was stopped");
		this.name = "DownloadStoppedError";
	}
}
