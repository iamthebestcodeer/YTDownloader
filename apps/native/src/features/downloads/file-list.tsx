import { PressableFeedback } from "heroui-native";
import { Text, View } from "react-native";

import { formatBytes } from "@/src/domain/format";
import { thumbnailForFile } from "@/src/domain/job";
import type { DownloadedFile, DownloadJob } from "@/src/domain/types";
import { Icon } from "@/src/ui/icon";
import { Thumbnail } from "@/src/ui/thumbnail";

type FileListProps = {
	job: DownloadJob;
	onOpenFile: (file: DownloadedFile) => void;
};

/** Every file a finished job produced, each with its own artwork; tap one to open it. */
export function FileList({ job, onOpenFile }: FileListProps) {
	return (
		<View className="border-separator gap-3 border-t pt-3">
			{job.files.map((file) => (
				<PressableFeedback
					key={file.uri}
					onPress={() => onOpenFile(file)}
					className="flex-row items-center gap-3 rounded-xl"
					accessibilityRole="button"
					accessibilityLabel={`Open ${file.name}`}
				>
					<Thumbnail uri={thumbnailForFile(file, job)} className="w-24" />
					<View className="flex-1 gap-0.5">
						<Text className="text-foreground text-sm" numberOfLines={2}>
							{file.name}
						</Text>
						<Text className="text-muted text-xs">{formatBytes(file.sizeBytes)}</Text>
					</View>
					<Icon name="play-circle-outline" size={22} className="text-accent" />
				</PressableFeedback>
			))}
		</View>
	);
}
