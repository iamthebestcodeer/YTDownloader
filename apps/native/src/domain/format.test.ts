import { describe, expect, test } from "bun:test";

import { formatBytes, formatDuration, formatEta } from "./format";

describe("formatBytes", () => {
	test("picks a readable unit", () => {
		expect(formatBytes(0)).toBe("0 B");
		expect(formatBytes(512)).toBe("512 B");
		expect(formatBytes(1536)).toBe("1.5 KB");
		expect(formatBytes(120_800_000)).toBe("115 MB");
		expect(formatBytes(3 * 1024 ** 3)).toBe("3.0 GB");
	});
});

describe("formatDuration", () => {
	test("formats minutes and hours", () => {
		expect(formatDuration(5)).toBe("0:05");
		expect(formatDuration(635)).toBe("10:35");
		expect(formatDuration(3725)).toBe("1:02:05");
	});
});

describe("formatEta", () => {
	test("rounds to the most useful unit", () => {
		expect(formatEta(45)).toBe("45s left");
		expect(formatEta(600)).toBe("10m left");
		expect(formatEta(5400)).toBe("1h 30m left");
	});
});
