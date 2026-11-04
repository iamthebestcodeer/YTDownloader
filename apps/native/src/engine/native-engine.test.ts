import { describe, expect, test } from "bun:test";

import type { YtDlpNativeModule } from "@/modules/yt-dlp";
import type { DownloadOptions } from "@/src/domain/types";

import { createNativeEngine } from "./native-engine";

const BOT_CHECK = "ERROR: [youtube] x: Sign in to confirm you're not a bot";
const URL = "https://www.youtube.com/watch?v=IORFphvIxCI";
const OPTIONS: DownloadOptions = {
	kind: "video",
	videoQuality: 1080,
	videoContainer: "mp4",
	audioFormat: "mp3",
	includePlaylist: false,
	embedThumbnail: true,
	embedMetadata: true,
	embedSubtitles: false,
	subtitleLanguages: "en.*",
};

function fakeNative(overrides: Partial<YtDlpNativeModule>): YtDlpNativeModule {
	return { stopDownload: () => false, ...overrides } as unknown as YtDlpNativeModule;
}

describe("native engine downloads", () => {
	test("a stop between two client attempts prevents the next attempt", async () => {
		const attempts: string[][] = [];
		let engine: ReturnType<typeof createNativeEngine>;
		const native = fakeNative({
			startDownload: async (_jobId, _url, args) => {
				attempts.push(args);
				// The user pauses while this first client is being refused.
				engine.stop("job");
				throw new Error(BOT_CHECK);
			},
		});
		engine = createNativeEngine(native);

		const download = engine.download({
			jobId: "job",
			url: URL,
			options: OPTIONS,
		});
		await expect(download).rejects.toThrow("The download was stopped");
		expect(attempts).toHaveLength(1);
	});

	test("a later download of the same job is not blocked by an earlier stop", async () => {
		const native = fakeNative({ startDownload: async () => [] });
		const engine = createNativeEngine(native);
		engine.stop("job");
		const files = await engine.download({
			jobId: "job",
			url: URL,
			options: OPTIONS,
		});
		expect(files).toEqual([]);
	});
});

describe("native engine previews", () => {
	test("stops rotating once a client returns real formats, even just one", async () => {
		const clients: string[] = [];
		const native = fakeNative({
			dumpJson: async (_target, args) => {
				const client = args.at(-1)?.replace("youtube:player_client=", "") ?? "";
				clients.push(client);
				if (clients.length === 1) throw new Error(BOT_CHECK);
				return JSON.stringify({
					id: "IORFphvIxCI",
					title: "Triangle Choke Song",
					formats: [{ format_id: "140", vcodec: "none", acodec: "mp4a.40.2" }],
				});
			},
		});
		const info = await createNativeEngine(native).fetchInfo(URL);
		expect(info.title).toBe("Triangle Choke Song");
		expect(clients).toHaveLength(2);
	});
});
