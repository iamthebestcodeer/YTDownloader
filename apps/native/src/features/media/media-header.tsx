import { Text, View } from "react-native";

import { Thumbnail } from "@/src/ui/thumbnail";

import type { DownloadPreview } from "./download-plan";

/** Shows exactly what is about to be downloaded: its artwork, title and channel. */
export function MediaHeader({ preview }: { preview: DownloadPreview }) {
	return (
		<View className="gap-3">
			<Thumbnail
				uri={preview.thumbnailUrl}
				durationSeconds={preview.durationSeconds}
				badge={preview.badge}
			/>
			<View className="gap-1">
				<Text className="text-foreground text-xl font-semibold" selectable>
					{preview.title}
				</Text>
				{preview.channel ? <Text className="text-muted text-sm">{preview.channel}</Text> : null}
			</View>
		</View>
	);
}
