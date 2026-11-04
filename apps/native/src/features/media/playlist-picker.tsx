import { Button, Checkbox, PressableFeedback } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import type { VideoSummary } from "@/src/domain/types";
import { Section } from "@/src/ui/section";
import { Thumbnail } from "@/src/ui/thumbnail";

import {
	isPicked,
	type PlaylistSelection,
	pickedCount,
	selectAll,
	selectNone,
	togglePosition,
} from "./playlist-selection";

/** Long playlists render in pages so the screen stays responsive. */
const PAGE_SIZE = 25;

type PlaylistPickerProps = {
	entries: VideoSummary[];
	selection: PlaylistSelection;
	onChange: (selection: PlaylistSelection) => void;
};

/** Lets the user see every video in a playlist and choose which ones to download. */
export function PlaylistPicker({ entries, selection, onChange }: PlaylistPickerProps) {
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const total = entries.length;
	const picked = pickedCount(selection, total);
	const hidden = total - visibleCount;

	const toggleAll = () => onChange(picked === total ? selectNone() : selectAll());

	return (
		<Section
			title={`Videos · ${picked} of ${total} picked`}
			action={
				<Button size="sm" variant="ghost" onPress={toggleAll}>
					{picked === total ? "Select none" : "Select all"}
				</Button>
			}
		>
			<View className="gap-3">
				{entries.slice(0, visibleCount).map((entry, index) => {
					const position = index + 1;
					return (
						<PlaylistRow
							key={`${position}-${entry.id}`}
							entry={entry}
							position={position}
							isPicked={isPicked(selection, position)}
							onToggle={() => onChange(togglePosition(selection, position, total))}
						/>
					);
				})}
				{hidden > 0 ? (
					<Button variant="secondary" onPress={() => setVisibleCount(total)}>
						{`Show ${hidden} more`}
					</Button>
				) : null}
			</View>
		</Section>
	);
}

type PlaylistRowProps = {
	entry: VideoSummary;
	position: number;
	isPicked: boolean;
	onToggle: () => void;
};

function PlaylistRow({ entry, position, isPicked, onToggle }: PlaylistRowProps) {
	return (
		<PressableFeedback
			onPress={onToggle}
			className="flex-row items-center gap-3 rounded-xl"
			accessibilityRole="checkbox"
			accessibilityState={{ checked: isPicked }}
			accessibilityLabel={entry.title}
		>
			<Thumbnail
				uri={entry.thumbnailUrl}
				durationSeconds={entry.durationSeconds}
				className={isPicked ? "w-28" : "w-28 opacity-40"}
			/>
			<View className="flex-1 gap-0.5">
				<Text className="text-muted text-xs">{position}</Text>
				<Text className="text-foreground text-sm" numberOfLines={2}>
					{entry.title}
				</Text>
			</View>
			<Checkbox isSelected={isPicked} onSelectedChange={onToggle} />
		</PressableFeedback>
	);
}
