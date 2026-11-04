import { parseProgressLine, summarizeError } from "@/src/domain/progress";
import type { DownloadJob } from "@/src/domain/types";
import type { DownloadEngine, EngineProgress } from "@/src/engine";

import { findJob, useDownloadsStore } from "./downloads-store";
import { useSettingsStore } from "./settings-store";

/**
 * Runs queued jobs on the engine, never more at once than the user allows,
 * and keeps the store in sync with the engine's progress.
 */
export class DownloadQueue {
	private readonly running = new Set<string>();
	/** Jobs stopped by the user; the engine rejects them, which is not a failure. */
	private readonly stopRequested = new Set<string>();

	constructor(private readonly engine: DownloadEngine) {}

	/** Starts processing; returns a function that stops listening for changes. */
	start(): () => void {
		const stopProgress = this.engine.onProgress((progress) => this.handleProgress(progress));
		const stopJobs = useDownloadsStore.subscribe(() => this.pump());
		const stopSettings = useSettingsStore.subscribe(() => this.pump());
		this.pump();
		return () => {
			stopProgress();
			stopJobs();
			stopSettings();
		};
	}

	pause(id: string): void {
		useDownloadsStore.getState().pause(id);
		this.stop(id);
	}

	/** Puts a paused or failed job back in line; partial files are reused. */
	resume(id: string): void {
		useDownloadsStore.getState().requeue(id);
	}

	/** Stops the job if needed and forgets it, including any partial files. */
	remove(id: string): void {
		useDownloadsStore.getState().remove(id);
		this.stop(id);
		this.engine.discard(id);
	}

	/** Forgets finished jobs; failed ones may have left partial files behind. */
	clearFinished(): void {
		const failed = useDownloadsStore.getState().jobs.filter((job) => job.status === "failed");
		useDownloadsStore.getState().clearFinished();
		for (const job of failed) this.engine.discard(job.id);
	}

	private stop(id: string): void {
		if (this.running.has(id)) this.stopRequested.add(id);
		this.engine.stop(id);
	}

	private pump(): void {
		const limit = useSettingsStore.getState().maxConcurrentDownloads;
		const oldestFirst = [...useDownloadsStore.getState().jobs].reverse();
		for (const job of oldestFirst) {
			if (this.running.size >= limit) return;
			// Starting a job updates the store, which can re-enter pump(), so read the latest status.
			if (!this.running.has(job.id) && findJob(job.id)?.status === "queued") {
				void this.run(job);
			}
		}
	}

	private async run(job: DownloadJob): Promise<void> {
		this.running.add(job.id);
		const store = useDownloadsStore.getState();
		store.markStarted(job.id);
		try {
			const files = await this.engine.download({
				jobId: job.id,
				url: job.url,
				options: job.options,
			});
			store.complete(job.id, files);
		} catch (error) {
			if (this.stopRequested.has(job.id)) return;
			store.fail(job.id, summarizeError(error instanceof Error ? error.message : String(error)));
		} finally {
			this.running.delete(job.id);
			this.stopRequested.delete(job.id);
			this.pump();
		}
	}

	private handleProgress({ jobId, percent, etaSeconds, line }: EngineProgress): void {
		const job = findJob(jobId);
		if (!job || (job.status !== "downloading" && job.status !== "processing")) return;
		const parsed = parseProgressLine(line);
		useDownloadsStore.getState().applyProgress(jobId, {
			percent: Math.max(0, percent),
			etaSeconds: etaSeconds > 0 ? etaSeconds : null,
			speed: parsed.speed,
			playlistProgress: parsed.playlistProgress,
			isPostProcessing: parsed.isPostProcessing,
		});
	}
}
