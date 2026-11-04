import { describe, expect, test } from "bun:test";

import { extractUrl, isVideoInsidePlaylist, isYoutubeUrl, looksLikeUrl } from "./url";

describe("extractUrl", () => {
	test("finds a link inside shared text", () => {
		expect(extractUrl("Watch this: https://youtu.be/dQw4w9WgXcQ?si=abc nice")).toBe(
			"https://youtu.be/dQw4w9WgXcQ?si=abc",
		);
	});

	test("drops trailing punctuation", () => {
		expect(extractUrl("(see https://www.youtube.com/watch?v=abc).")).toBe(
			"https://www.youtube.com/watch?v=abc",
		);
	});

	test("returns null when there is no link", () => {
		expect(extractUrl("lofi hip hop")).toBeNull();
	});
});

describe("looksLikeUrl", () => {
	test("distinguishes links from search terms", () => {
		expect(looksLikeUrl("  https://youtube.com/shorts/abc ")).toBe(true);
		expect(looksLikeUrl("never gonna give you up")).toBe(false);
	});
});

describe("isYoutubeUrl", () => {
	test("accepts youtube domains and subdomains", () => {
		expect(isYoutubeUrl("https://m.youtube.com/watch?v=1")).toBe(true);
		expect(isYoutubeUrl("https://youtu.be/1")).toBe(true);
		expect(isYoutubeUrl("https://music.youtube.com/playlist?list=1")).toBe(true);
	});

	test("rejects look-alike domains", () => {
		expect(isYoutubeUrl("https://notyoutube.com/watch?v=1")).toBe(false);
		expect(isYoutubeUrl("not a url")).toBe(false);
	});
});

describe("isVideoInsidePlaylist", () => {
	test("needs both a video and a playlist id", () => {
		expect(isVideoInsidePlaylist("https://www.youtube.com/watch?v=a&list=b")).toBe(true);
		expect(isVideoInsidePlaylist("https://www.youtube.com/playlist?list=b")).toBe(false);
		expect(isVideoInsidePlaylist("https://www.youtube.com/watch?v=a")).toBe(false);
	});
});
