import { describe, expect, test } from "bun:test";

import playlistFixture from "./__fixtures__/playlist.json";
import searchFixture from "./__fixtures__/search.json";
import videoFixture from "./__fixtures__/video.json";
import {
	MediaInfoParseError,
	parseMediaInfo,
	parseSearchResults,
	standardHeightOf,
} from "./media-info";

const VIDEO_URL = "https://youtu.be/aqz-KE-bpKQ";
const PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLQVvvaa0QuDfKTOs3Keq_kaG2P55YRn5v";

describe("parseMediaInfo for a single video", () => {
	const info = parseMediaInfo(JSON.stringify(videoFixture), VIDEO_URL);

	test("uses a combined stream as-is when no separate video stream exists", () => {
		const json = JSON.stringify({
			id: "x",
			formats: [
				{ format_id: "18", vcodec: "avc1", acodec: "mp4a", width: 640, height: 360, filesize: 9 },
			],
		});
		const parsed = parseMediaInfo(json, VIDEO_URL);
		expect(parsed.kind === "video" && parsed.qualities[1]).toEqual({
			quality: 360,
			estimatedBytes: 9,
		});
	});

	test("reads the basic metadata", () => {
		expect(info).toMatchObject({
			kind: "video",
			id: "aqz-KE-bpKQ",
			url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
			channel: "Blender",
			durationSeconds: 635,
			thumbnailUrl: "https://i.ytimg.com/vi_webp/aqz-KE-bpKQ/maxresdefault.webp",
		});
	});

	test("offers every available height, best first", () => {
		if (info.kind !== "video") throw new Error("expected a video");
		expect(info.qualities.map((option) => option.quality)).toEqual([
			"best",
			2160,
			1440,
			1080,
			720,
			480,
			360,
		]);
	});

	test("estimates sizes as largest video stream plus best audio", () => {
		if (info.kind !== "video") throw new Error("expected a video");
		const sizeOf = (quality: unknown) =>
			info.qualities.find((option) => option.quality === quality)?.estimatedBytes;
		expect(info.estimatedAudioBytes).toBe(10_800_000);
		expect(sizeOf(1080)).toBe(110_000_000 + 10_800_000);
		expect(sizeOf(1440)).toBe(300_000_000 + 10_800_000);
		expect(sizeOf(360)).toBe(12_000_000 + 10_800_000);
		expect(sizeOf(2160)).toBeNull();
		expect(sizeOf("best")).toBeNull();
	});
});

describe("parseMediaInfo for a playlist", () => {
	const info = parseMediaInfo(JSON.stringify(playlistFixture), PLAYLIST_URL);

	test("reads the playlist and its entries", () => {
		if (info.kind !== "playlist") throw new Error("expected a playlist");
		expect(info.title).toBe("Machine Learning with Python");
		expect(info.channel).toBe("sentdex");
		expect(info.entries).toHaveLength(3);
		expect(info.entries[0]?.url).toStartWith("https://www.youtube.com/watch?v=");
		expect(info.thumbnailUrl).toStartWith("https://");
	});
});

describe("parseSearchResults", () => {
	test("returns one summary per result", () => {
		const results = parseSearchResults(JSON.stringify(searchFixture));
		expect(results).toHaveLength(3);
		expect(results[0]).toMatchObject({
			id: "aqz-KE-bpKQ",
			channel: "Blender",
			durationSeconds: 635,
		});
	});

	test("falls back to the YouTube thumbnail when none is listed", () => {
		const json = JSON.stringify({
			entries: [{ id: "abc", url: "https://www.youtube.com/watch?v=abc" }],
		});
		expect(parseSearchResults(json)[0]?.thumbnailUrl).toBe(
			"https://i.ytimg.com/vi/abc/mqdefault.jpg",
		);
	});

	test("rejects output that is not JSON", () => {
		expect(() => parseSearchResults("ERROR: nope")).toThrow(MediaInfoParseError);
	});
});

describe("standardHeightOf", () => {
	test("labels landscape, vertical, 4:3 and cinematic frames like YouTube", () => {
		expect(standardHeightOf(1920, 1080)).toBe(1080);
		expect(standardHeightOf(1080, 1920)).toBe(1080);
		expect(standardHeightOf(960, 720)).toBe(720);
		expect(standardHeightOf(1280, 536)).toBe(720);
		expect(standardHeightOf(null, 480)).toBe(480);
		expect(standardHeightOf(256, 144)).toBeNull();
		expect(standardHeightOf(null, null)).toBeNull();
	});
});
