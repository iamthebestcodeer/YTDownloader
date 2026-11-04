import { formatBytes } from "@/src/domain/format";
import type {
	AudioFormat,
	MediaKind,
	QualityOption,
	VideoContainer,
	VideoQuality,
} from "@/src/domain/types";
import type { ChipOption } from "@/src/ui/option-chips";

export const STANDARD_QUALITIES: readonly VideoQuality[] = [
	"best",
	2160,
	1440,
	1080,
	720,
	480,
	360,
];

export const KIND_CHOICES: ReadonlyArray<ChipOption<MediaKind>> = [
	{ value: "video", label: "Video" },
	{ value: "audio", label: "Audio only" },
];

export const AUDIO_FORMAT_CHOICES: ReadonlyArray<ChipOption<AudioFormat>> = [
	{ value: "mp3", label: "MP3" },
	{ value: "m4a", label: "M4A" },
	{ value: "opus", label: "Opus" },
];

export const CONTAINER_CHOICES: ReadonlyArray<ChipOption<VideoContainer>> = [
	{ value: "mp4", label: "MP4" },
	{ value: "mkv", label: "MKV" },
];

export function qualityLabel(quality: VideoQuality): string {
	return quality === "best" ? "Best" : `${quality}p`;
}

export function qualityChoices(options: readonly QualityOption[]): Array<ChipOption<VideoQuality>> {
	return options.map(({ quality, estimatedBytes }) => ({
		value: quality,
		label: qualityLabel(quality),
		hint: estimatedBytes ? formatBytes(estimatedBytes) : undefined,
	}));
}

export const STANDARD_QUALITY_CHOICES = qualityChoices(
	STANDARD_QUALITIES.map((quality) => ({ quality, estimatedBytes: null })),
);

/**
 * Keeps the user's preferred quality when the video has it; otherwise picks the
 * highest available quality below it, so a 1080p default on a 720p video becomes 720p.
 */
export function closestAvailableQuality(
	preferred: VideoQuality,
	available: readonly VideoQuality[],
): VideoQuality {
	if (preferred === "best" || available.includes(preferred)) return preferred;
	const lowerHeights = available.flatMap((quality) =>
		quality !== "best" && quality < preferred ? [quality] : [],
	);
	return lowerHeights.length > 0 ? (Math.max(...lowerHeights) as VideoQuality) : "best";
}
