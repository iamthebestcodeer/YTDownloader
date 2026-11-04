import type { MediaInfo, PlaylistInfo, QualityOption, VideoInfo, VideoSummary } from "./types";
import { isYoutubeUrl } from "./url";

type RawObject = Record<string, unknown>;

type Threshold = readonly [height: number, minimumShortSide: number, minimumLongSide: number];

/**
 * Standard heights with the smallest frame sides that still count as that quality.
 * Both sides are checked so that 4:3 (960x720) and cinematic (1280x536) frames are
 * labelled the way YouTube labels them.
 */
const QUALITY_THRESHOLDS: readonly Threshold[] = [
	[2160, 2000, 3800],
	[1440, 1400, 2500],
	[1080, 1000, 1900],
	[720, 700, 1260],
	[480, 470, 840],
	[360, 350, 630],
];

const UNAVAILABLE_ENTRY: VideoSummary = {
	id: "",
	url: "",
	title: "Unavailable video",
	channel: null,
	durationSeconds: null,
	thumbnailUrl: null,
};

export class MediaInfoParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MediaInfoParseError";
	}
}

/** Parses the output of `yt-dlp --dump-single-json --flat-playlist`. */
export function parseMediaInfo(json: string, requestedUrl: string): MediaInfo {
	const raw = parseObject(json);
	return raw._type === "playlist"
		? toPlaylistInfo(raw, requestedUrl)
		: toVideoInfo(raw, requestedUrl);
}

/** Parses the output of `yt-dlp --dump-single-json --flat-playlist ytsearchN:<query>`. */
export function parseSearchResults(json: string): VideoSummary[] {
	return arrayOf(parseObject(json).entries)
		.filter(isObject)
		.map((entry) => toSummary(entry, ""))
		.filter((entry) => entry.url !== "");
}

/** Maps a frame size to the standard quality it belongs to, e.g. 1920x1080 → 1080. */
export function standardHeightOf(width: number | null, height: number | null): number | null {
	const sides = [width, height].filter((side): side is number => side !== null && side > 0);
	if (sides.length === 0) return null;
	const shortSide = Math.min(...sides);
	const longSide = Math.max(...sides);
	const match = QUALITY_THRESHOLDS.find(
		([, minimumShortSide, minimumLongSide]) =>
			shortSide >= minimumShortSide || (sides.length === 2 && longSide >= minimumLongSide),
	);
	return match ? match[0] : null;
}

function toVideoInfo(raw: RawObject, requestedUrl: string): VideoInfo {
	const formats = arrayOf(raw.formats).filter(isObject);
	const estimatedAudioBytes = largestSize(formats.filter(isAudioOnly));
	return {
		kind: "video",
		...toSummary(raw, requestedUrl),
		qualities: qualityOptionsOf(formats, estimatedAudioBytes),
		estimatedAudioBytes,
		hasMediaFormats: formats.some((format) => hasVideo(format) || hasAudio(format)),
	};
}

function toPlaylistInfo(raw: RawObject, requestedUrl: string): PlaylistInfo {
	// Every entry keeps its place, even unavailable ones, so list positions match
	// yt-dlp's playlist index (used for --playlist-items).
	const entries = arrayOf(raw.entries).map((entry) =>
		isObject(entry) ? toSummary(entry, "") : UNAVAILABLE_ENTRY,
	);
	return {
		kind: "playlist",
		id: stringOf(raw.id) ?? requestedUrl,
		url: stringOf(raw.webpage_url) ?? requestedUrl,
		title: stringOf(raw.title) ?? "Untitled playlist",
		channel: channelOf(raw),
		thumbnailUrl: largestThumbnailOf(raw) ?? entries[0]?.thumbnailUrl ?? null,
		entries,
	};
}

function toSummary(raw: RawObject, fallbackUrl: string): VideoSummary {
	const id = stringOf(raw.id) ?? "";
	const url = stringOf(raw.webpage_url) ?? stringOf(raw.url) ?? fallbackUrl;
	return {
		id,
		url,
		title: stringOf(raw.title) ?? "Untitled video",
		channel: channelOf(raw),
		durationSeconds: numberOf(raw.duration),
		thumbnailUrl: thumbnailOf(raw, id, url),
	};
}

function qualityOptionsOf(formats: RawObject[], audioBytes: number | null): QualityOption[] {
	const videoFormatsByHeight = new Map<number, RawObject[]>();
	for (const format of formats.filter(hasVideo)) {
		const height = standardHeightOf(numberOf(format.width), numberOf(format.height));
		if (height === null) continue;
		videoFormatsByHeight.set(height, [...(videoFormatsByHeight.get(height) ?? []), format]);
	}

	const heights = [...videoFormatsByHeight.keys()].sort((a, b) => b - a);
	const options: QualityOption[] = heights.map((height) => ({
		quality: height as QualityOption["quality"],
		estimatedBytes: estimateBytes(videoFormatsByHeight.get(height) ?? [], audioBytes),
	}));
	return [{ quality: "best", estimatedBytes: options[0]?.estimatedBytes ?? null }, ...options];
}

/**
 * yt-dlp prefers a separate video stream plus the best audio stream; a combined
 * stream (which already contains audio) is only used when no separate one exists.
 */
function estimateBytes(formatsAtHeight: RawObject[], audioBytes: number | null): number | null {
	const videoOnly = formatsAtHeight.filter((format) => !hasAudio(format));
	if (videoOnly.length === 0) return largestSize(formatsAtHeight);
	const videoBytes = largestSize(videoOnly);
	return videoBytes === null ? null : videoBytes + (audioBytes ?? 0);
}

function largestSize(formats: RawObject[]): number | null {
	const sizes = formats
		.map((format) => numberOf(format.filesize) ?? numberOf(format.filesize_approx))
		.filter((size): size is number => size !== null);
	return sizes.length > 0 ? Math.max(...sizes) : null;
}

function hasVideo(format: RawObject): boolean {
	const codec = stringOf(format.vcodec);
	return codec !== null && codec !== "none";
}

function hasAudio(format: RawObject): boolean {
	const codec = stringOf(format.acodec);
	return codec !== null && codec !== "none";
}

function isAudioOnly(format: RawObject): boolean {
	return !hasVideo(format) && hasAudio(format);
}

function channelOf(raw: RawObject): string | null {
	return stringOf(raw.channel) ?? stringOf(raw.uploader);
}

function thumbnailOf(raw: RawObject, id: string, url: string): string | null {
	const explicit = stringOf(raw.thumbnail) ?? largestThumbnailOf(raw);
	if (explicit) return explicit;
	return id && isYoutubeUrl(url) ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
}

/** yt-dlp lists thumbnails from smallest to largest. */
function largestThumbnailOf(raw: RawObject): string | null {
	const thumbnails = arrayOf(raw.thumbnails).filter(isObject);
	const last = thumbnails.at(-1);
	return last ? stringOf(last.url) : null;
}

function parseObject(json: string): RawObject {
	let value: unknown;
	try {
		value = JSON.parse(json);
	} catch {
		throw new MediaInfoParseError("yt-dlp returned output that is not JSON");
	}
	if (!isObject(value)) throw new MediaInfoParseError("yt-dlp returned an unexpected result");
	return value;
}

function isObject(value: unknown): value is RawObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function arrayOf(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function stringOf(value: unknown): string | null {
	return typeof value === "string" && value.length > 0 ? value : null;
}

function numberOf(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
