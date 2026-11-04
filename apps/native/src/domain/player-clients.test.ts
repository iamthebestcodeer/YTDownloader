import { describe, expect, test } from "bun:test";

import {
	isBlockedByYoutube,
	PLAYER_CLIENTS,
	playerClientArgs,
	rotationOrder,
} from "./player-clients";

describe("playerClientArgs", () => {
	test("leaves the default client to yt-dlp", () => {
		expect(playerClientArgs("default")).toEqual([]);
		expect(playerClientArgs("web_safari")).toEqual([
			"--extractor-args",
			"youtube:player_client=web_safari",
		]);
	});
});

describe("isBlockedByYoutube", () => {
	test("recognises YouTube refusing a client", () => {
		expect(
			isBlockedByYoutube(
				"ERROR: [youtube] IORFphvIxCI: Sign in to confirm you’re not a bot. Use --cookies-from-browser",
			),
		).toBe(true);
		expect(isBlockedByYoutube("ERROR: [youtube] x: Requested format is not available")).toBe(true);
		expect(
			isBlockedByYoutube("ERROR: unable to download video data: HTTP Error 403: Forbidden"),
		).toBe(true);
	});

	test("does not retry errors no client can fix", () => {
		expect(isBlockedByYoutube("ERROR: [youtube] x: Video unavailable. This video is private")).toBe(
			false,
		);
		expect(isBlockedByYoutube("ERR_DOWNLOAD_CANCELLED")).toBe(false);
	});
});

describe("rotationOrder", () => {
	test("tries the last working client first, then the rest", () => {
		expect(rotationOrder(null)).toEqual([...PLAYER_CLIENTS]);
		const order = rotationOrder("mweb");
		expect(order[0]).toBe("mweb");
		expect(order).toHaveLength(PLAYER_CLIENTS.length);
		expect(new Set(order).size).toBe(PLAYER_CLIENTS.length);
	});
});
