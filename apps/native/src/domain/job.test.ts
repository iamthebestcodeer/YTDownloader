import { describe, expect, test } from "bun:test";

import {
	isActive,
	isFinished,
	overallProgress,
	recoverAfterRestart,
	thumbnailForFile,
	videoIdFromFileName,
} from "./job";
import type { DownloadJob } from "./types";

const JOB: DownloadJob = {
	id: "1",
	url: "https://youtu.be/x",
	title: "x",
	thumbnailUrl: null,
	options: {
		kind: "audio",
		videoQuality: "best",
		videoContainer: "mp4",
		audioFormat: "mp3",
		includePlaylist: false,
		embedThumbnail: true,
		embedMetadata: true,
		embedSubtitles: false,
		subtitleLanguages: "en.*",
	},
	status: "downloading",
	percent: 50,
	speed: "1MiB/s",
	etaSeconds: 10,
	playlistProgress: null,
	files: [],
	error: null,
	createdAt: 0,
	finishedAt: null,
};

describe("overallProgress", () => {
	test("uses the item percentage for single videos", () => {
		expect(overallProgress(JOB)).toBe(0.5);
	});

	test("counts finished playlist items", () => {
		expect(overallProgress({ ...JOB, playlistProgress: { current: 3, total: 4 } })).toBe(0.625);
	});

	test("is complete once the job is done and never exceeds 1", () => {
		expect(overallProgress({ ...JOB, status: "completed", percent: 0 })).toBe(1);
		expect(overallProgress({ ...JOB, percent: 140 })).toBe(1);
	});
});

describe("status helpers", () => {
	test("classify jobs", () => {
		expect(isActive({ ...JOB, status: "queued" })).toBe(true);
		expect(isActive({ ...JOB, status: "paused" })).toBe(false);
		expect(isFinished({ ...JOB, status: "failed" })).toBe(true);
		expect(isFinished(JOB)).toBe(false);
	});
});

describe("recoverAfterRestart", () => {
	test("pauses jobs that were interrupted", () => {
		expect(recoverAfterRestart(JOB)).toMatchObject({
			status: "paused",
			speed: null,
			etaSeconds: null,
		});
		expect(recoverAfterRestart({ ...JOB, status: "processing" }).status).toBe("paused");
	});

	test("leaves other jobs untouched", () => {
		const queued = { ...JOB, status: "queued" as const };
		expect(recoverAfterRestart(queued)).toBe(queued);
	});
});

describe("per-file thumbnails", () => {
	const file = (name: string) => ({
		uri: "content://1",
		name,
		mimeType: "video/mp4",
		sizeBytes: 1,
	});

	test("reads the video id back from the file name", () => {
		expect(videoIdFromFileName("003 - Triangle Choke Song [IORFphvIxCI].mp4")).toBe("IORFphvIxCI");
		expect(videoIdFromFileName("clip [clip].mp4")).toBeNull();
	});

	test("uses each video's own YouTube thumbnail", () => {
		const job = {
			...JOB,
			url: "https://www.youtube.com/playlist?list=PL1",
			thumbnailUrl: "playlist.jpg",
		};
		expect(thumbnailForFile(file("a [IORFphvIxCI].mp3"), job)).toBe(
			"https://i.ytimg.com/vi/IORFphvIxCI/mqdefault.jpg",
		);
		expect(thumbnailForFile(file("notes.txt"), job)).toBe("playlist.jpg");
	});

	test("falls back to the job artwork for other sites", () => {
		const job = { ...JOB, url: "https://example.com/v.mp4", thumbnailUrl: "art.jpg" };
		expect(thumbnailForFile(file("v [abcdefghijk].mp4"), job)).toBe("art.jpg");
	});
});
