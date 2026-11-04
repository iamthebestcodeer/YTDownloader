import { describe, expect, test } from "bun:test";

import { isActive, isFinished, overallProgress, recoverAfterRestart } from "./job";
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
