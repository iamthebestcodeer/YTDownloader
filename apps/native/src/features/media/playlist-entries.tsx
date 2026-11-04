import { Text, View } from "react-native";

import { formatDuration } from "@/src/domain/format";
import type { VideoSummary } from "@/src/domain/types";
import { Section } from "@/src/ui/section";

const PREVIEW_COUNT = 5;

export function PlaylistEntries({ entries }: { entries: VideoSummary[] }) {
	const hidden = entries.length - PREVIEW_COUNT;
	return (
		<Section title="In this playlist">
			<View className="gap-2">
				{entries.slice(0, PREVIEW_COUNT).map((entry, index) => (
					<View key={entry.id || index} className="flex-row items-center gap-3">
						<Text className="text-muted w-6 text-right text-xs">{index + 1}</Text>
						<Text className="text-foreground flex-1 text-sm" numberOfLines={1}>
							{entry.title}
						</Text>
						{entry.durationSeconds ? (
							<Text className="text-muted text-xs">{formatDuration(entry.durationSeconds)}</Text>
						) : null}
					</View>
				))}
				{hidden > 0 ? <Text className="text-muted pl-9 text-xs">and {hidden} more</Text> : null}
			</View>
		</Section>
	);
}
