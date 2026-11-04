import { formatBytes } from "@/src/domain/format";
import type { DownloadOptions, MediaInfo } from "@/src/domain/types";
import { isVideoInsidePlaylist } from "@/src/domain/url";

/** What will be queued for a link, given the options picked on the media screen. */
export type DownloadPlan = {
	url: string;
	title: string;
	thumbnailUrl: string | null;
	includePlaylist: boolean;
	buttonLabel: string;
};

/**
 * A link like `watch?v=a&list=b` is reported by yt-dlp as the playlist. When the user
 * turns off "whole playlist" we download only the video it points at.
 */
export function planDownload(
	info: MediaInfo,
	requestedUrl: string,
	options: DownloadOptions,
): DownloadPlan {
	if (info.kind === "video") {
		return {
			url: info.url,
			title: info.title,
			thumbnailUrl: info.thumbnailUrl,
			includePlaylist: false,
			buttonLabel: `Download${sizeSuffix(info, options)}`,
		};
	}

	if (!options.includePlaylist && isVideoInsidePlaylist(requestedUrl)) {
		const videoId = new URL(requestedUrl).searchParams.get("v");
		const entry = info.entries.find((candidate) => candidate.id === videoId);
		return {
			url: requestedUrl,
			title: entry?.title ?? info.title,
			thumbnailUrl: entry?.thumbnailUrl ?? info.thumbnailUrl,
			includePlaylist: false,
			buttonLabel: "Download this video",
		};
	}

	const count = info.entries.length;
	return {
		url: info.url,
		title: info.title,
		thumbnailUrl: info.thumbnailUrl,
		includePlaylist: true,
		buttonLabel: `Download ${count} ${count === 1 ? "video" : "videos"}`,
	};
}

function sizeSuffix(info: Extract<MediaInfo, { kind: "video" }>, options: DownloadOptions): string {
	const bytes =
		options.kind === "audio"
			? info.estimatedAudioBytes
			: info.qualities.find((option) => option.quality === options.videoQuality)?.estimatedBytes;
	return bytes ? ` · ~${formatBytes(bytes)}` : "";
}
