import type { PlaylistProgress } from "./types";

export type ProgressLineInfo = {
	playlistProgress: PlaylistProgress | null;
	speed: string | null;
	isPostProcessing: boolean;
};

const PLAYLIST_ITEM_PATTERN = /Downloading (?:item|video) (\d+) of (\d+)/i;
const SPEED_PATTERN = /\bat\s+(~?\s*[\d.]+\s*[KMGT]?i?B\/s)/i;
const POST_PROCESSOR_PATTERN =
	/^\[(Merger|ExtractAudio|EmbedThumbnail|EmbedSubtitle|Metadata|VideoRemuxer|VideoConvertor|ThumbnailsConvertor|Fixup\w*)\]/;

/** Extracts what the UI cares about from one line of yt-dlp console output. */
export function parseProgressLine(line: string): ProgressLineInfo {
	const trimmed = line.trim();
	return {
		playlistProgress: playlistProgressOf(trimmed),
		speed: trimmed.match(SPEED_PATTERN)?.[1]?.replace(/\s+/g, "") ?? null,
		isPostProcessing: POST_PROCESSOR_PATTERN.test(trimmed),
	};
}

/** Reduces a yt-dlp failure (often a long stderr dump) to its most useful line. */
export function summarizeError(raw: string): string {
	const lines = raw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
	const errorLine = lines.findLast((line) => line.startsWith("ERROR:"));
	const message = errorLine ?? lines.at(-1) ?? "Unknown error";
	return message
		.replace(/^ERROR:\s*/, "")
		.replace(/^\[[^\]]+\]\s*[\w-]+:\s*/, "")
		.trim();
}

function playlistProgressOf(line: string): PlaylistProgress | null {
	const match = line.match(PLAYLIST_ITEM_PATTERN);
	if (!match) return null;
	return { current: Number(match[1]), total: Number(match[2]) };
}
