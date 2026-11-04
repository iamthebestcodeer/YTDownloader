/**
 * YouTube serves different formats and blocks differently depending on which app ("player
 * client") yt-dlp pretends to be. When one is refused, another often still works.
 * "default" lets yt-dlp choose; the rest are tried in order after it.
 */
export const PLAYER_CLIENTS = ["default", "web_safari", "mweb", "tv_simply", "android_vr"] as const;

export type PlayerClient = (typeof PLAYER_CLIENTS)[number];

const BLOCKED_PATTERNS = [
	/confirm you.?re not a bot/i,
	/sign in to confirm/i,
	/requested format is not available/i,
	/only images are available/i,
	/HTTP Error 403/i,
	/HTTP Error 429/i,
	/content isn.?t available, try again later/i,
	/failed to extract any player response/i,
];

export function playerClientArgs(client: PlayerClient): string[] {
	if (client === "default") return [];
	return ["--extractor-args", `youtube:player_client=${client}`];
}

/** True when the failure is YouTube refusing this client, so another client may succeed. */
export function isBlockedByYoutube(message: string): boolean {
	return BLOCKED_PATTERNS.some((pattern) => pattern.test(message));
}

/** All clients, starting with the one that worked last time. */
export function rotationOrder(preferred: PlayerClient | null): PlayerClient[] {
	if (!preferred) return [...PLAYER_CLIENTS];
	return [preferred, ...PLAYER_CLIENTS.filter((client) => client !== preferred)];
}
