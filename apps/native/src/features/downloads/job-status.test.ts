import { describe, expect, test } from "bun:test";

import type { DownloadJob } from "@/src/domain/types";
import { INITIAL_DEFAULTS } from "@/src/store/settings-store";

import { describeJob } from "./job-status";

const JOB: DownloadJob = {
	id: "1",
	url: "https://youtu.be/x",
	title: "x",
	thumbnailUrl: null,
	options: { ...INITIAL_DEFAULTS, includePlaylist: false },
	status: "downloading",
	percent: 42.7,
	speed: "2.1MiB/s",
	etaSeconds: 90,
	playlistProgress: null,
	files: [],
	error: null,
	createdAt: 0,
	finishedAt: null,
};

describe("describeJob", () => {
	test("summarises a running download", () => {
		expect(describeJob(JOB)).toBe("42% · 2.1MiB/s · 2m left");
		expect(
			describeJob({
				...JOB,
				playlistProgress: { current: 2, total: 9 },
				speed: null,
				etaSeconds: null,
			}),
		).toBe("Item 2 of 9 · 42%");
	});

	test("summarises finished files", () => {
		const file = {
			uri: "content://x",
			name: "x.mp3",
			mimeType: "audio/mpeg",
			sizeBytes: 5_242_880,
		};
		expect(describeJob({ ...JOB, status: "completed", files: [file] })).toBe("5.0 MB");
		expect(describeJob({ ...JOB, status: "completed", files: [file, file] })).toBe(
			"2 files · 10.0 MB",
		);
	});

	test("shows the error of a failed job", () => {
		expect(describeJob({ ...JOB, status: "failed", error: "Video unavailable" })).toBe(
			"Video unavailable",
		);
	});
});
