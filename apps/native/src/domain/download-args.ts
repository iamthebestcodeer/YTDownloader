import type { AudioFormat, DownloadOptions } from "./types";

const SINGLE_FILE_TEMPLATE = "%(title).150B [%(id)s].%(ext)s";
const PLAYLIST_FILE_TEMPLATE =
	"%(playlist_title).80B/%(playlist_index)03d - %(title).150B [%(id)s].%(ext)s";

/** Containers ffmpeg can embed cover art into without extra Python packages. */
const AUDIO_FORMATS_WITH_COVER_ART: ReadonlySet<AudioFormat> = new Set(["mp3", "m4a"]);

/** Arguments for `yt-dlp --dump-single-json`, used to preview a link before downloading. */
export function buildInfoArgs(): string[] {
	return ["--dump-single-json", "--flat-playlist", "--no-warnings"];
}

/** Target and arguments for a YouTube search returning [limit] results. */
export function buildSearchRequest(
	query: string,
	limit: number,
): { target: string; args: string[] } {
	return { target: `ytsearch${limit}:${query.trim()}`, args: buildInfoArgs() };
}

/**
 * Translates the options picked in the UI into yt-dlp command-line arguments.
 * The output directory is added by the native layer.
 */
export function buildDownloadArgs(options: DownloadOptions): string[] {
	return [
		...commonArgs(options),
		...(options.kind === "audio" ? audioArgs(options) : videoArgs(options)),
		...metadataArgs(options),
	];
}

function commonArgs(options: DownloadOptions): string[] {
	return [
		options.includePlaylist ? "--yes-playlist" : "--no-playlist",
		"--output",
		options.includePlaylist ? PLAYLIST_FILE_TEMPLATE : SINGLE_FILE_TEMPLATE,
		"--no-mtime",
		"--continue",
		"--retries",
		"10",
		"--fragment-retries",
		"10",
		"--concurrent-fragments",
		"4",
	];
}

function audioArgs(options: DownloadOptions): string[] {
	return [
		"--format",
		"bestaudio/best",
		"--extract-audio",
		"--audio-format",
		options.audioFormat,
		"--audio-quality",
		"0",
	];
}

function videoArgs(options: DownloadOptions): string[] {
	const sort =
		options.videoQuality === "best" ? [] : ["--format-sort", `res:${options.videoQuality}`];
	return [
		"--format",
		"bestvideo*+bestaudio/best",
		...sort,
		"--merge-output-format",
		options.videoContainer,
		"--remux-video",
		options.videoContainer,
		...subtitleArgs(options),
	];
}

function subtitleArgs(options: DownloadOptions): string[] {
	if (!options.embedSubtitles) return [];
	return ["--write-subs", "--sub-langs", options.subtitleLanguages, "--embed-subs"];
}

function metadataArgs(options: DownloadOptions): string[] {
	return [
		...(options.embedMetadata ? ["--embed-metadata"] : []),
		...(shouldEmbedThumbnail(options) ? ["--embed-thumbnail"] : []),
	];
}

function shouldEmbedThumbnail(options: DownloadOptions): boolean {
	if (!options.embedThumbnail) return false;
	return options.kind === "video" || AUDIO_FORMATS_WITH_COVER_ART.has(options.audioFormat);
}
