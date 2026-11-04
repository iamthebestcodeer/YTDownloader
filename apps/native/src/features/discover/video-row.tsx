import { PressableFeedback } from "heroui-native";
import { Text, View } from "react-native";

import type { VideoSummary } from "@/src/domain/types";
import { Thumbnail } from "@/src/ui/thumbnail";

type VideoRowProps = {
	video: VideoSummary;
	onPress: (video: VideoSummary) => void;
};

export function VideoRow({ video, onPress }: VideoRowProps) {
	return (
		<PressableFeedback
			onPress={() => onPress(video)}
			className="flex-row gap-3 rounded-2xl"
			accessibilityRole="button"
			accessibilityLabel={video.title}
		>
			<Thumbnail
				uri={video.thumbnailUrl}
				durationSeconds={video.durationSeconds}
				className="w-40"
			/>
			<View className="flex-1 gap-1 py-0.5">
				<Text className="text-foreground text-sm font-medium" numberOfLines={3}>
					{video.title}
				</Text>
				{video.channel ? (
					<Text className="text-muted text-xs" numberOfLines={1}>
						{video.channel}
					</Text>
				) : null}
			</View>
		</PressableFeedback>
	);
}
