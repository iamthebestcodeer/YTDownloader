import { formatBytes, formatEta } from "@/src/domain/format";
import type { DownloadJob, JobStatus } from "@/src/domain/types";

type ChipColor = "accent" | "default" | "success" | "warning" | "danger";

export const STATUS_APPEARANCE: Record<JobStatus, { label: string; color: ChipColor }> = {
	queued: { label: "Queued", color: "default" },
	downloading: { label: "Downloading", color: "accent" },
	processing: { label: "Processing", color: "accent" },
	paused: { label: "Paused", color: "warning" },
	completed: { label: "Done", color: "success" },
	failed: { label: "Failed", color: "danger" },
};

/** One line of secondary text describing where a job stands. */
export function describeJob(job: DownloadJob): string {
	switch (job.status) {
		case "queued":
			return "Waiting for a free slot";
		case "downloading":
			return joinParts([playlistPart(job), `${Math.floor(job.percent)}%`, job.speed, etaPart(job)]);
		case "processing":
			return joinParts([playlistPart(job), "Converting and tagging"]);
		case "paused":
			return "Tap resume to continue where it stopped";
		case "completed":
			return joinParts([fileCountPart(job), formatBytes(totalBytes(job))]);
		case "failed":
			return job.error ?? "Something went wrong";
	}
}

function playlistPart(job: DownloadJob): string | null {
	const playlist = job.playlistProgress;
	return playlist ? `Item ${playlist.current} of ${playlist.total}` : null;
}

function etaPart(job: DownloadJob): string | null {
	return job.etaSeconds ? formatEta(job.etaSeconds) : null;
}

function fileCountPart(job: DownloadJob): string | null {
	return job.files.length > 1 ? `${job.files.length} files` : null;
}

function totalBytes(job: DownloadJob): number {
	return job.files.reduce((sum, file) => sum + file.sizeBytes, 0);
}

function joinParts(parts: Array<string | null>): string {
	return parts.filter(Boolean).join(" · ");
}
