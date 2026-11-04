import { describe, expect, test } from "bun:test";

import playlistFixture from "@/src/domain/__fixtures__/playlist.json";
import videoFixture from "@/src/domain/__fixtures__/video.json";
import { parseMediaInfo } from "@/src/domain/media-info";
import type { DownloadOptions } from "@/src/domain/types";
import { INITIAL_DEFAULTS } from "@/src/store/settings-store";

import { planDownload } from "./download-plan";

const OPTIONS: DownloadOptions = { ...INITIAL_DEFAULTS, includePlaylist: true };
const playlist = parseMediaInfo(
	JSON.stringify(playlistFixture),
	"https://www.youtube.com/playlist?list=PL",
);
const video = parseMediaInfo(JSON.stringify(videoFixture), "https://youtu.be/aqz-KE-bpKQ");

describe("planDownload", () => {
	test("downloads a single video with its size estimate", () => {
		const plan = planDownload(video, "https://youtu.be/aqz-KE-bpKQ", {
			...OPTIONS,
			videoQuality: 1080,
		});
		expect(plan).toMatchObject({
			includePlaylist: false,
			buttonLabel: "Download · ~115 MB",
		});
	});

	test("estimates audio downloads from the audio stream", () => {
		const plan = planDownload(video, "https://youtu.be/aqz-KE-bpKQ", {
			...OPTIONS,
			kind: "audio",
		});
		expect(plan.buttonLabel).toBe("Download · ~10.3 MB");
	});

	test("downloads a whole playlist", () => {
		const plan = planDownload(playlist, "https://www.youtube.com/playlist?list=PL", OPTIONS);
		expect(plan).toMatchObject({
			includePlaylist: true,
			playlistItems: undefined,
			buttonLabel: "Download 3 videos",
			canDownload: true,
		});
		expect(plan.preview).toMatchObject({
			title: "Machine Learning with Python",
			badge: "3 videos",
		});
	});

	test("downloads only the linked video when the playlist is turned off", () => {
		const firstEntry = playlist.kind === "playlist" ? playlist.entries[0] : undefined;
		const url = `https://www.youtube.com/watch?v=${firstEntry?.id}&list=PL`;
		const plan = planDownload(playlist, url, {
			...OPTIONS,
			includePlaylist: false,
		});
		expect(plan).toMatchObject({ url, includePlaylist: false });
		expect(plan.preview).toMatchObject({
			title: firstEntry?.title,
			thumbnailUrl: firstEntry?.thumbnailUrl,
		});
	});

	test("previews the single video with its own thumbnail", () => {
		const plan = planDownload(video, "https://youtu.be/aqz-KE-bpKQ", OPTIONS);
		expect(plan.preview).toMatchObject({
			title: "Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film",
			thumbnailUrl: "https://i.ytimg.com/vi_webp/aqz-KE-bpKQ/maxresdefault.webp",
			durationSeconds: 635,
		});
	});

	test("downloads only the picked playlist videos, in playlist order", () => {
		const plan = planDownload(playlist, "https://www.youtube.com/playlist?list=PL", {
			...OPTIONS,
			playlistItems: [3, 1],
		});
		expect(plan).toMatchObject({ playlistItems: [1, 3], buttonLabel: "Download 2 videos" });
		expect(plan.preview.badge).toBe("2 of 3 videos");
	});

	test("treats picking every video as the whole playlist", () => {
		const plan = planDownload(playlist, "https://www.youtube.com/playlist?list=PL", {
			...OPTIONS,
			playlistItems: [1, 2, 3],
		});
		expect(plan.playlistItems).toBeUndefined();
	});

	test("cannot download an empty selection", () => {
		const plan = planDownload(playlist, "https://www.youtube.com/playlist?list=PL", {
			...OPTIONS,
			playlistItems: [],
		});
		expect(plan).toMatchObject({ canDownload: false, buttonLabel: "Pick at least one video" });
	});
});
