import { describe, expect, test } from "bun:test";

import { buildDownloadArgs, buildSearchRequest } from "./download-args";
import type { DownloadOptions } from "./types";

const BASE_OPTIONS: DownloadOptions = {
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

function valueAfter(args: string[], flag: string): string | undefined {
	const index = args.indexOf(flag);
	return index === -1 ? undefined : args[index + 1];
}

describe("buildDownloadArgs for video", () => {
	test("caps the resolution and merges into the chosen container", () => {
		const args = buildDownloadArgs(BASE_OPTIONS);
		expect(valueAfter(args, "--format")).toBe("bestvideo*+bestaudio/best");
		expect(valueAfter(args, "--format-sort")).toBe("res:1080");
		expect(valueAfter(args, "--merge-output-format")).toBe("mp4");
		expect(valueAfter(args, "--remux-video")).toBe("mp4");
		expect(args).toContain("--no-playlist");
		expect(args).toContain("--embed-thumbnail");
		expect(args).toContain("--embed-metadata");
		expect(args).not.toContain("--extract-audio");
	});

	test("does not limit the resolution for best quality", () => {
		expect(buildDownloadArgs({ ...BASE_OPTIONS, videoQuality: "best" })).not.toContain(
			"--format-sort",
		);
	});

	test("embeds subtitles only when asked", () => {
		expect(buildDownloadArgs(BASE_OPTIONS)).not.toContain("--embed-subs");
		const args = buildDownloadArgs({
			...BASE_OPTIONS,
			embedSubtitles: true,
			subtitleLanguages: "de.*",
		});
		expect(args).toContain("--embed-subs");
		expect(valueAfter(args, "--sub-langs")).toBe("de.*");
	});
});

describe("buildDownloadArgs for audio", () => {
	test("extracts audio in the chosen format at best quality", () => {
		const args = buildDownloadArgs({
			...BASE_OPTIONS,
			kind: "audio",
			audioFormat: "m4a",
			embedSubtitles: true,
		});
		expect(args).toContain("--extract-audio");
		expect(valueAfter(args, "--audio-format")).toBe("m4a");
		expect(valueAfter(args, "--audio-quality")).toBe("0");
		expect(args).toContain("--embed-thumbnail");
		expect(args).not.toContain("--embed-subs");
		expect(args).not.toContain("--merge-output-format");
	});

	test("skips cover art for opus, which ffmpeg cannot embed", () => {
		const args = buildDownloadArgs({
			...BASE_OPTIONS,
			kind: "audio",
			audioFormat: "opus",
		});
		expect(args).not.toContain("--embed-thumbnail");
	});
});

describe("playlists", () => {
	test("downloads every entry into a folder named after the playlist", () => {
		const args = buildDownloadArgs({ ...BASE_OPTIONS, includePlaylist: true });
		expect(args).toContain("--yes-playlist");
		expect(valueAfter(args, "--output")).toStartWith(
			"%(playlist_title).80B/%(playlist_index)03d - ",
		);
	});
});

describe("buildSearchRequest", () => {
	test("uses the ytsearch pseudo-URL", () => {
		expect(buildSearchRequest("  lofi beats ", 20).target).toBe("ytsearch20:lofi beats");
	});
});
