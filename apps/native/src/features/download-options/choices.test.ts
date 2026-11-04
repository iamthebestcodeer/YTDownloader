import { describe, expect, test } from "bun:test";

import { closestAvailableQuality, qualityChoices } from "./choices";

describe("closestAvailableQuality", () => {
	test("keeps an available preference", () => {
		expect(closestAvailableQuality(1080, ["best", 1080, 720])).toBe(1080);
		expect(closestAvailableQuality("best", ["best", 720])).toBe("best");
	});

	test("steps down to the nearest lower quality", () => {
		expect(closestAvailableQuality(1080, ["best", 720, 480])).toBe(720);
	});

	test("falls back to best when nothing is lower", () => {
		expect(closestAvailableQuality(360, ["best", 1080, 720])).toBe("best");
	});
});

describe("qualityChoices", () => {
	test("labels qualities with their estimated size", () => {
		expect(
			qualityChoices([
				{ quality: "best", estimatedBytes: null },
				{ quality: 720, estimatedBytes: 73_400_320 },
			]),
		).toEqual([
			{ value: "best", label: "Best", hint: undefined },
			{ value: 720, label: "720p", hint: "70.0 MB" },
		]);
	});
});
