import { describe, expect, test } from "bun:test";

import { parseProgressLine, summarizeError } from "./progress";

describe("parseProgressLine", () => {
	test("reads the download speed", () => {
		const info = parseProgressLine(
			"[download]  45.3% of ~ 10.00MiB at  1.20MiB/s ETA 00:07 (frag 3/10)",
		);
		expect(info).toEqual({
			playlistProgress: null,
			speed: "1.20MiB/s",
			isPostProcessing: false,
		});
	});

	test("reads the playlist position", () => {
		expect(parseProgressLine("[download] Downloading item 3 of 12").playlistProgress).toEqual({
			current: 3,
			total: 12,
		});
	});

	test("recognises post-processing steps", () => {
		expect(parseProgressLine('[Merger] Merging formats into "a.mp4"').isPostProcessing).toBe(true);
		expect(parseProgressLine("[ExtractAudio] Destination: a.mp3").isPostProcessing).toBe(true);
		expect(parseProgressLine("[FixupM4a] Correcting container").isPostProcessing).toBe(true);
		expect(parseProgressLine("[youtube] abc: Downloading webpage").isPostProcessing).toBe(false);
	});
});

describe("summarizeError", () => {
	test("keeps only the last ERROR line without the extractor prefix", () => {
		const stderr = [
			"WARNING: [youtube] something minor",
			"ERROR: [youtube] dQw4w9WgXcQ: Video unavailable. This video is private",
			"",
		].join("\n");
		expect(summarizeError(stderr)).toBe("Video unavailable. This video is private");
	});

	test("falls back to the last line", () => {
		expect(summarizeError("java.io.IOException: No space left on device\n")).toBe(
			"java.io.IOException: No space left on device",
		);
		expect(summarizeError("")).toBe("Unknown error");
	});
});
