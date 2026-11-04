import type { AudioFormat, DownloadOptions } from "./types";

const SINGLE_FILE_TEMPLATE = "%(title).150B [%(id)s].%(ext)s";
const PLAYLIST_FILE_TEMPLATE =
	"%(playlist_title).80B/%(playlist_index)03d - %(title).150B [%(id)s].%(ext)s";

/** Containers ffmpeg can embed cover art into without extra Python packages. */
const AUDIO_FORMATS_WITH_COVER_ART: ReadonlySet<AudioFormat> = new Set(["mp3", "m4a"]);

/** Arguments for `yt-dlp --dump-single-json`, used to preview a link before downloading. */
export function buildInfoArgs(): string[] {
	// A client that only returns metadata still gives a usable preview.
	return ["--dump-single-json", "--flat-playlist", "--no-warnings", "--ignore-no-formats-error"];
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
		...playlistItemArgs(options),
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

function playlistItemArgs(options: DownloadOptions): string[] {
	if (!options.includePlaylist || !options.playlistItems?.length) return [];
	return ["--playlist-items", options.playlistItems.join(",")];
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

/**
 * Requests uploaded and auto-generated captions and embeds them. yt-dlp keeps the
 * separate subtitle files when --write-subs is given, unless no-keep-subs is set.
 */
function subtitleArgs(options: DownloadOptions): string[] {
	if (!options.embedSubtitles) return [];
	return [
		"--write-subs",
		"--write-auto-subs",
		"--sub-langs",
		options.subtitleLanguages,
		"--embed-subs",
		"--compat-options",
		"no-keep-subs",
	];
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
