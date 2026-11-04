import { create } from "zustand";
import { persist } from "zustand/middleware";

import { isFinished, recoverAfterRestart } from "@/src/domain/job";
import type {
	DownloadedFile,
	DownloadJob,
	DownloadOptions,
	PlaylistProgress,
} from "@/src/domain/types";

import { persistentStorage } from "./storage";

export type NewDownload = {
	url: string;
	title: string;
	thumbnailUrl: string | null;
	options: DownloadOptions;
};

export type ProgressUpdate = {
	percent: number;
	etaSeconds: number | null;
	speed: string | null;
	playlistProgress: PlaylistProgress | null;
	isPostProcessing: boolean;
};

type DownloadsState = {
	jobs: DownloadJob[];
	enqueue: (download: NewDownload) => string;
	markStarted: (id: string) => void;
	applyProgress: (id: string, update: ProgressUpdate) => void;
	complete: (id: string, files: DownloadedFile[]) => void;
	fail: (id: string, error: string) => void;
	pause: (id: string) => void;
	requeue: (id: string) => void;
	remove: (id: string) => void;
	clearFinished: () => void;
};

export const useDownloadsStore = create<DownloadsState>()(
	persist(
		(set) => {
			const updateJob = (id: string, change: (job: DownloadJob) => DownloadJob) =>
				set((state) => ({
					jobs: state.jobs.map((job) => (job.id === id ? change(job) : job)),
				}));

			return {
				jobs: [],

				enqueue: (download) => {
					const job = createJob(download);
					set((state) => ({ jobs: [job, ...state.jobs] }));
					return job.id;
				},

				markStarted: (id) =>
					updateJob(id, (job) => ({
						...job,
						status: "downloading",
						error: null,
					})),

				applyProgress: (id, update) =>
					updateJob(id, (job) => ({
						...job,
						status: update.isPostProcessing ? "processing" : "downloading",
						percent: update.percent,
						etaSeconds: update.etaSeconds,
						speed: update.speed ?? job.speed,
						playlistProgress: update.playlistProgress ?? job.playlistProgress,
					})),

				complete: (id, files) =>
					updateJob(id, (job) => ({
						...job,
						status: "completed",
						percent: 100,
						speed: null,
						etaSeconds: null,
						files,
						finishedAt: Date.now(),
					})),

				fail: (id, error) =>
					updateJob(id, (job) => ({
						...job,
						status: "failed",
						speed: null,
						etaSeconds: null,
						error,
					})),

				pause: (id) =>
					updateJob(id, (job) => ({
						...job,
						status: "paused",
						speed: null,
						etaSeconds: null,
					})),

				requeue: (id) => updateJob(id, (job) => ({ ...job, status: "queued", error: null })),

				remove: (id) => set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) })),

				clearFinished: () =>
					set((state) => ({
						jobs: state.jobs.filter((job) => !isFinished(job)),
					})),
			};
		},
		{
			name: "downloads",
			version: 1,
			storage: persistentStorage,
			partialize: (state) => ({ jobs: state.jobs }),
			merge: (persisted, current) => {
				const saved = (persisted as Partial<DownloadsState> | undefined)?.jobs ?? [];
				return { ...current, jobs: saved.map(recoverAfterRestart) };
			},
		},
	),
);

export function findJob(id: string): DownloadJob | undefined {
	return useDownloadsStore.getState().jobs.find((job) => job.id === id);
}

function createJob(download: NewDownload): DownloadJob {
	return {
		id: createId(),
		...download,
		status: "queued",
		percent: 0,
		speed: null,
		etaSeconds: null,
		playlistProgress: null,
		files: [],
		error: null,
		createdAt: Date.now(),
		finishedAt: null,
	};
}

function createId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
