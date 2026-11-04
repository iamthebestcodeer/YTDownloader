import { Button, Card, Chip } from "heroui-native";
import { Text, View } from "react-native";

import { overallProgress } from "@/src/domain/job";
import type { DownloadJob } from "@/src/domain/types";
import { Icon, type IconName } from "@/src/ui/icon";
import { ProgressBar } from "@/src/ui/progress-bar";
import { Thumbnail } from "@/src/ui/thumbnail";

import { qualityLabel } from "../download-options/choices";
import { describeJob, STATUS_APPEARANCE } from "./job-status";

export type DownloadCardActions = {
	onPause: (job: DownloadJob) => void;
	onResume: (job: DownloadJob) => void;
	onRemove: (job: DownloadJob) => void;
	onOpen: (job: DownloadJob) => void;
};

type DownloadCardProps = DownloadCardActions & { job: DownloadJob };

export function DownloadCard({ job, ...actions }: DownloadCardProps) {
	const status = STATUS_APPEARANCE[job.status];
	const showProgress = job.status !== "completed" && job.status !== "failed";
	return (
		<Card className="gap-3 p-3">
			<View className="flex-row gap-3">
				<Thumbnail uri={job.thumbnailUrl} className="w-28" />
				<View className="flex-1 gap-1.5">
					<Text className="text-foreground text-sm font-medium" numberOfLines={2}>
						{job.title}
					</Text>
					<View className="flex-row items-center gap-2">
						<Chip size="sm" variant="soft" color={status.color}>
							<Chip.Label>{status.label}</Chip.Label>
						</Chip>
						<Text className="text-muted text-xs">{formatOf(job)}</Text>
					</View>
				</View>
			</View>
			{showProgress ? (
				<ProgressBar
					value={overallProgress(job)}
					tone={job.status === "paused" ? "muted" : "accent"}
				/>
			) : null}
			<View className="flex-row items-center gap-2">
				<Text className="text-muted flex-1 text-xs" numberOfLines={2}>
					{describeJob(job)}
				</Text>
				<JobActions job={job} {...actions} />
			</View>
		</Card>
	);
}

function JobActions({ job, onPause, onResume, onRemove, onOpen }: DownloadCardProps) {
	switch (job.status) {
		case "queued":
		case "downloading":
		case "processing":
			return (
				<>
					{job.status === "downloading" ? (
						<ActionButton icon="pause" label="Pause" onPress={() => onPause(job)} />
					) : null}
					<ActionButton icon="close" label="Cancel" onPress={() => onRemove(job)} />
				</>
			);
		case "paused":
		case "failed":
			return (
				<>
					<ActionButton
						icon={job.status === "paused" ? "play" : "refresh"}
						label={job.status === "paused" ? "Resume" : "Retry"}
						onPress={() => onResume(job)}
					/>
					<ActionButton icon="trash-outline" label="Remove" onPress={() => onRemove(job)} />
				</>
			);
		case "completed":
			return (
				<>
					<Button size="sm" variant="secondary" onPress={() => onOpen(job)}>
						<Icon name="play-circle-outline" size={16} />
						<Button.Label>Open</Button.Label>
					</Button>
					<ActionButton
						icon="trash-outline"
						label="Remove from list"
						onPress={() => onRemove(job)}
					/>
				</>
			);
	}
}

function ActionButton({
	icon,
	label,
	onPress,
}: {
	icon: IconName;
	label: string;
	onPress: () => void;
}) {
	return (
		<Button size="sm" variant="ghost" isIconOnly onPress={onPress} accessibilityLabel={label}>
			<Icon name={icon} size={18} />
		</Button>
	);
}

function formatOf(job: DownloadJob): string {
	const { options } = job;
	if (options.kind === "audio") return options.audioFormat.toUpperCase();
	return `${qualityLabel(options.videoQuality)} ${options.videoContainer.toUpperCase()}`;
}
