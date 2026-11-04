import { Text, View } from "react-native";

import type { MediaInfo } from "@/src/domain/types";
import { Thumbnail } from "@/src/ui/thumbnail";

export function MediaHeader({ info }: { info: MediaInfo }) {
	const isPlaylist = info.kind === "playlist";
	return (
		<View className="gap-3">
			<Thumbnail
				uri={info.thumbnailUrl}
				durationSeconds={isPlaylist ? null : info.durationSeconds}
				badge={isPlaylist ? `${info.entries.length} videos` : undefined}
			/>
			<View className="gap-1">
				<Text className="text-foreground text-xl font-semibold" selectable>
					{info.title}
				</Text>
				{info.channel ? <Text className="text-muted text-sm">{info.channel}</Text> : null}
			</View>
		</View>
	);
}
