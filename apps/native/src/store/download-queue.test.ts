import { beforeEach, describe, expect, mock, test } from "bun:test";

const memory = new Map<string, string>();
mock.module("@react-native-async-storage/async-storage", () => ({
	default: {
		getItem: async (key: string) => memory.get(key) ?? null,
		setItem: async (key: string, value: string) => void memory.set(key, value),
		removeItem: async (key: string) => void memory.delete(key),
	},
}));

const { DownloadQueue } = await import("./download-queue");
const { useDownloadsStore } = await import("./downloads-store");
const { INITIAL_DEFAULTS, useSettingsStore } = await import("./settings-store");

import type { DownloadedFile } from "@/src/domain/types";
import type { DownloadEngine, DownloadRequest, EngineProgress } from "@/src/engine/download-engine";

type Pending = {
	resolve: (files: DownloadedFile[]) => void;
	reject: (error: Error) => void;
};

function createFakeEngine() {
	const pending = new Map<string, Pending>();
	const started: string[] = [];
	const stopped: string[] = [];
	const discarded: string[] = [];
	let progressListener: ((progress: EngineProgress) => void) | null = null;

	const engine: DownloadEngine = {
		isSupported: true,
		initialize: async () => {},
		version: async () => "test",
		update: async () => "up-to-date",
		fetchInfo: () => Promise.reject(new Error("unused")),
		search: async () => [],
		download: (request: DownloadRequest) =>
			new Promise((resolve, reject) => {
				started.push(request.jobId);
				pending.set(request.jobId, { resolve, reject });
			}),
		stop: (jobId) => {
			stopped.push(jobId);
			pending.get(jobId)?.reject(new Error("ERR_DOWNLOAD_CANCELLED"));
		},
		discard: (jobId) => void discarded.push(jobId),
		openFile: () => {},
		onProgress: (listener) => {
			progressListener = listener;
			return () => {
				progressListener = null;
			};
		},
	};

	return {
		engine,
		started,
		stopped,
		discarded,
		finish: (jobId: string, files: DownloadedFile[] = []) => pending.get(jobId)?.resolve(files),
		failWith: (jobId: string, message: string) => pending.get(jobId)?.reject(new Error(message)),
		emitProgress: (progress: EngineProgress) => progressListener?.(progress),
	};
}

function enqueue(title: string): string {
	return useDownloadsStore.getState().enqueue({
		url: `https://youtu.be/${title}`,
		title,
		thumbnailUrl: null,
		options: { ...INITIAL_DEFAULTS, includePlaylist: false },
	});
}

const statusOf = (id: string) =>
	useDownloadsStore.getState().jobs.find((job) => job.id === id)?.status;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("DownloadQueue", () => {
	let fake: ReturnType<typeof createFakeEngine>;
	let stop: () => void;

	beforeEach(() => {
		stop?.();
		useDownloadsStore.setState({ jobs: [] });
		useSettingsStore.setState({ maxConcurrentDownloads: 2 });
		fake = createFakeEngine();
		stop = new DownloadQueue(fake.engine).start();
	});

	test("runs at most the allowed number of jobs, oldest first, each only once", async () => {
		const first = enqueue("first");
		const second = enqueue("second");
		const third = enqueue("third");

		expect(fake.started).toEqual([first, second]);
		expect(statusOf(third)).toBe("queued");

		fake.finish(first, [
			{
				uri: "content://1",
				name: "a.mp3",
				mimeType: "audio/mpeg",
				sizeBytes: 1,
			},
		]);
		await flush();

		expect(statusOf(first)).toBe("completed");
		expect(fake.started).toEqual([first, second, third]);
	});

	test("turns engine progress into job progress", () => {
		const id = enqueue("video");
		fake.emitProgress({
			jobId: id,
			percent: 42,
			etaSeconds: 9,
			line: "[download] 42% at 3.00MiB/s",
		});
		expect(useDownloadsStore.getState().jobs[0]).toMatchObject({
			status: "downloading",
			percent: 42,
			etaSeconds: 9,
			speed: "3.00MiB/s",
		});

		fake.emitProgress({
			jobId: id,
			percent: 100,
			etaSeconds: 0,
			line: "[Merger] Merging formats",
		});
		expect(statusOf(id)).toBe("processing");
	});

	test("records a readable error when yt-dlp fails", async () => {
		const id = enqueue("broken");
		fake.failWith(id, "WARNING: x\nERROR: [youtube] broken: Video unavailable");
		await flush();
		const job = useDownloadsStore.getState().jobs[0];
		expect(job?.status).toBe("failed");
		expect(job?.error).toBe("Video unavailable");
	});

	test("pausing stops the engine without marking the job failed, and resume restarts it", async () => {
		const queue = new DownloadQueue(fake.engine);
		const id = enqueue("pausable");
		queue.pause(id);
		await flush();
		expect(fake.stopped).toEqual([id]);
		expect(statusOf(id)).toBe("paused");

		queue.resume(id);
		expect(fake.started).toEqual([id, id]);
		expect(statusOf(id)).toBe("downloading");
	});

	test("removing a job stops it and deletes its partial files", async () => {
		const queue = new DownloadQueue(fake.engine);
		const id = enqueue("unwanted");
		queue.remove(id);
		await flush();
		expect(fake.stopped).toEqual([id]);
		expect(fake.discarded).toEqual([id]);
		expect(useDownloadsStore.getState().jobs).toHaveLength(0);
	});
});
