import { formatBytes } from "@/src/domain/format";
import type { DownloadOptions, MediaInfo, VideoInfo } from "@/src/domain/types";
import { isVideoInsidePlaylist } from "@/src/domain/url";

/** The artwork and title of exactly what will be downloaded. */
export type DownloadPreview = {
	title: string;
	channel: string | null;
	thumbnailUrl: string | null;
	durationSeconds: number | null;
	badge?: string;
};

/** What will be queued for a link, given the options picked on the media screen. */
export type DownloadPlan = {
	url: string;
	preview: DownloadPreview;
	includePlaylist: boolean;
	/** Playlist positions to fetch; undefined means the whole playlist. */
	playlistItems: readonly number[] | undefined;
	buttonLabel: string;
	canDownload: boolean;
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
			preview: { ...info },
			includePlaylist: false,
			playlistItems: undefined,
			buttonLabel: `Download${sizeSuffix(info, options)}`,
			canDownload: true,
		};
	}

	if (!options.includePlaylist && isVideoInsidePlaylist(requestedUrl)) {
		const videoId = new URL(requestedUrl).searchParams.get("v");
		const entry = info.entries.find((candidate) => candidate.id === videoId);
		return {
			url: requestedUrl,
			preview: {
				title: entry?.title ?? info.title,
				channel: entry?.channel ?? info.channel,
				thumbnailUrl:
					entry?.thumbnailUrl ??
					(videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null),
				durationSeconds: entry?.durationSeconds ?? null,
			},
			includePlaylist: false,
			playlistItems: undefined,
			buttonLabel: "Download this video",
			canDownload: true,
		};
	}

	const total = info.entries.length;
	const items = selectedItems(options.playlistItems, total);
	const count = items?.length ?? total;
	return {
		url: info.url,
		preview: {
			title: info.title,
			channel: info.channel,
			thumbnailUrl: info.thumbnailUrl,
			durationSeconds: null,
			badge: count === total ? `${total} videos` : `${count} of ${total} videos`,
		},
		includePlaylist: true,
		playlistItems: items,
		buttonLabel:
			count === 0
				? "Pick at least one video"
				: `Download ${count} ${count === 1 ? "video" : "videos"}`,
		canDownload: count > 0,
	};
}

/** Picking every video is the same as downloading the whole playlist. */
function selectedItems(items: readonly number[] | undefined, total: number) {
	if (!items || items.length === total) return undefined;
	return [...items].sort((a, b) => a - b);
}

function sizeSuffix(info: VideoInfo, options: DownloadOptions): string {
	const bytes =
		options.kind === "audio"
			? info.estimatedAudioBytes
			: info.qualities.find((option) => option.quality === options.videoQuality)?.estimatedBytes;
	return bytes ? ` · ~${formatBytes(bytes)}` : "";
}
