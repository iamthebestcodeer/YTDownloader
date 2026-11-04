import { Button, useToast } from "heroui-native";
import { type ReactNode, useCallback, useMemo } from "react";
import { View } from "react-native";

import { isFinished } from "@/src/domain/job";
import type { DownloadedFile, DownloadJob } from "@/src/domain/types";
import { engine } from "@/src/engine";
import { useDownloadsStore } from "@/src/store/downloads-store";
import { downloadQueue } from "@/src/store/queue";
import { EmptyState } from "@/src/ui/empty-state";
import { Screen } from "@/src/ui/screen";
import { Section } from "@/src/ui/section";

import { DownloadCard, type DownloadCardActions } from "./download-card";

export function DownloadsScreen() {
	const jobs = useDownloadsStore((store) => store.jobs);
	const actions = useJobActions();

	const { current, finished } = useMemo(
		() => ({
			current: jobs.filter((job) => !isFinished(job)),
			finished: jobs.filter(isFinished),
		}),
		[jobs],
	);

	if (jobs.length === 0) {
		return (
			<Screen>
				<EmptyState
					icon="download-outline"
					title="No downloads yet"
					message="Videos and songs you download appear here. Files are saved to Download/YTDownloader."
				/>
			</Screen>
		);
	}

	return (
		<Screen>
			{current.length > 0 ? <JobList title="In progress" jobs={current} actions={actions} /> : null}
			{finished.length > 0 ? (
				<JobList
					title="Finished"
					jobs={finished}
					actions={actions}
					headerAction={
						<Button size="sm" variant="ghost" onPress={() => downloadQueue.clearFinished()}>
							Clear
						</Button>
					}
				/>
			) : null}
		</Screen>
	);
}

type JobListProps = {
	title: string;
	jobs: DownloadJob[];
	actions: DownloadCardActions;
	headerAction?: ReactNode;
};

function JobList({ title, jobs, actions, headerAction }: JobListProps) {
	return (
		<Section title={title} action={headerAction}>
			<View className="gap-3">
				{jobs.map((job) => (
					<DownloadCard key={job.id} job={job} {...actions} />
				))}
			</View>
		</Section>
	);
}

function useJobActions(): DownloadCardActions {
	const { toast } = useToast();

	const onOpenFile = useCallback(
		(file: DownloadedFile) => {
			try {
				engine.openFile(file);
			} catch {
				toast.show({ variant: "danger", label: "No app can open this file" });
			}
		},
		[toast],
	);

	return useMemo(
		() => ({
			onPause: (job: DownloadJob) => downloadQueue.pause(job.id),
			onResume: (job: DownloadJob) => downloadQueue.resume(job.id),
			onRemove: (job: DownloadJob) => downloadQueue.remove(job.id),
			onOpenFile,
		}),
		[onOpenFile],
	);
}
