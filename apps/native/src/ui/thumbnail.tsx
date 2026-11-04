import { Image } from "expo-image";
import { cn } from "heroui-native";
import { Text, View } from "react-native";
import { withUniwind } from "uniwind";

import { formatDuration } from "@/src/domain/format";

import { Icon } from "./icon";

const StyledImage = withUniwind(Image);

type ThumbnailProps = {
	uri: string | null;
	durationSeconds?: number | null;
	badge?: string;
	className?: string;
};

/** 16:9 artwork with an optional duration or count badge. */
export function Thumbnail({ uri, durationSeconds, badge, className }: ThumbnailProps) {
	const label = badge ?? (durationSeconds ? formatDuration(durationSeconds) : null);
	return (
		<View className={cn("bg-default aspect-video overflow-hidden rounded-xl", className)}>
			{uri ? (
				<StyledImage source={{ uri }} className="size-full" contentFit="cover" transition={150} />
			) : (
				<View className="size-full items-center justify-center">
					<Icon name="musical-notes-outline" size={28} className="text-muted" />
				</View>
			)}
			{label ? (
				<View className="absolute right-1.5 bottom-1.5 rounded-md bg-black/75 px-1.5 py-0.5">
					<Text className="text-[11px] font-semibold text-white">{label}</Text>
				</View>
			) : null}
		</View>
	);
}
