import { describe, expect, test } from "bun:test";

import { isPicked, pickedCount, selectNone, togglePosition } from "./playlist-selection";

describe("playlist selection", () => {
	test("starts with every video picked", () => {
		expect(isPicked(undefined, 4)).toBe(true);
		expect(pickedCount(undefined, 5)).toBe(5);
	});

	test("unticking a video narrows the selection", () => {
		const selection = togglePosition(undefined, 2, 4);
		expect(selection).toEqual([1, 3, 4]);
		expect(isPicked(selection, 2)).toBe(false);
		expect(pickedCount(selection, 4)).toBe(3);
	});

	test("ticking the last missing video goes back to the whole playlist", () => {
		expect(togglePosition([1, 3, 4], 2, 4)).toBeUndefined();
	});

	test("keeps positions in playlist order", () => {
		expect(togglePosition([5, 1], 3, 10)).toEqual([1, 3, 5]);
	});

	test("can start from nothing", () => {
		expect(togglePosition(selectNone(), 7, 10)).toEqual([7]);
	});
});
