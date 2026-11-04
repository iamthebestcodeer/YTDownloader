export type MediaKind = "video" | "audio";

export type AudioFormat = "mp3" | "m4a" | "opus";

export type VideoContainer = "mp4" | "mkv";

/** Maximum video height in pixels, or "best" for no limit. */
export type VideoQuality = "best" | 2160 | 1440 | 1080 | 720 | 480 | 360;

export type DownloadOptions = {
	kind: MediaKind;
	videoQuality: VideoQuality;
	videoContainer: VideoContainer;
	audioFormat: AudioFormat;
	includePlaylist: boolean;
	embedThumbnail: boolean;
	embedMetadata: boolean;
	embedSubtitles: boolean;
	subtitleLanguages: string;
	/** 1-based positions of the playlist videos to download; all of them when absent. */
	playlistItems?: readonly number[];
};

export type VideoSummary = {
	id: string;
	url: string;
	title: string;
	channel: string | null;
	durationSeconds: number | null;
	thumbnailUrl: string | null;
};

export type QualityOption = {
	quality: VideoQuality;
	estimatedBytes: number | null;
};

export type VideoInfo = VideoSummary & {
	kind: "video";
	qualities: QualityOption[];
	estimatedAudioBytes: number | null;
};

export type PlaylistInfo = {
	kind: "playlist";
	id: string;
	url: string;
	title: string;
	channel: string | null;
	thumbnailUrl: string | null;
	entries: VideoSummary[];
};

export type MediaInfo = VideoInfo | PlaylistInfo;

export type JobStatus = "queued" | "downloading" | "processing" | "paused" | "completed" | "failed";

export type DownloadedFile = {
	uri: string;
	name: string;
	mimeType: string;
	sizeBytes: number;
};

export type PlaylistProgress = {
	current: number;
	total: number;
};

export type DownloadJob = {
	id: string;
	url: string;
	title: string;
	thumbnailUrl: string | null;
	options: DownloadOptions;
	status: JobStatus;
	percent: number;
	speed: string | null;
	etaSeconds: number | null;
	playlistProgress: PlaylistProgress | null;
	files: DownloadedFile[];
	error: string | null;
	createdAt: number;
	finishedAt: number | null;
};
