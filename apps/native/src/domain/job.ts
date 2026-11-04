import type { DownloadJob, JobStatus } from "./types";

const ACTIVE_STATUSES: ReadonlySet<JobStatus> = new Set(["queued", "downloading", "processing"]);
const FINISHED_STATUSES: ReadonlySet<JobStatus> = new Set(["completed", "failed"]);

export function isActive(job: DownloadJob): boolean {
	return ACTIVE_STATUSES.has(job.status);
}

export function isFinished(job: DownloadJob): boolean {
	return FINISHED_STATUSES.has(job.status);
}

/** Progress from 0 to 1 across the whole job, counting earlier playlist items as done. */
export function overallProgress(job: DownloadJob): number {
	if (job.status === "completed") return 1;
	const itemFraction = clamp(job.percent / 100);
	const playlist = job.playlistProgress;
	if (!playlist || playlist.total <= 0) return itemFraction;
	return clamp((playlist.current - 1 + itemFraction) / playlist.total);
}

/** A process that died mid-download leaves partial files behind, so it can be resumed. */
export function recoverAfterRestart(job: DownloadJob): DownloadJob {
	if (job.status !== "downloading" && job.status !== "processing") return job;
	return { ...job, status: "paused", speed: null, etaSeconds: null };
}

function clamp(value: number): number {
	return Math.min(1, Math.max(0, value));
}
