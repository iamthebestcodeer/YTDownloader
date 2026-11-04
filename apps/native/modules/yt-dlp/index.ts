import { NativeModule, requireOptionalNativeModule } from "expo";

export type NativeProgressEvent = {
	jobId: string;
	percent: number;
	etaSeconds: number;
	line: string;
};

export type NativeSharedTextEvent = {
	text: string;
};

export type NativePublishedFile = {
	uri: string;
	name: string;
	mimeType: string;
	sizeBytes: number;
};

type YtDlpEvents = {
	onProgress: (event: NativeProgressEvent) => void;
	onSharedText: (event: NativeSharedTextEvent) => void;
};

declare class YtDlpNativeModuleClass extends NativeModule<YtDlpEvents> {
	initialize(): Promise<void>;
	getVersion(): Promise<string | null>;
	update(): Promise<"updated" | "up-to-date">;
	dumpJson(target: string, args: string[]): Promise<string>;
	startDownload(jobId: string, url: string, args: string[]): Promise<NativePublishedFile[]>;
	stopDownload(jobId: string): boolean;
	discardDownload(jobId: string): boolean;
	openFile(uri: string, mimeType: string): void;
	consumeSharedText(): string | null;
}

export type YtDlpNativeModule = YtDlpNativeModuleClass;

/** `null` on platforms without the native module (iOS, web). */
export const YtDlp = requireOptionalNativeModule<YtDlpNativeModuleClass>("YtDlp");
