import { Card } from "heroui-native";
import { View } from "react-native";
import type { VideoQuality } from "@/src/domain/types";
import type { DefaultDownloadOptions } from "@/src/store/settings-store";
import type { ChipOption } from "@/src/ui/option-chips";
import { OptionChips } from "@/src/ui/option-chips";
import { Section } from "@/src/ui/section";
import { SegmentedControl } from "@/src/ui/segmented-control";
import { ToggleRow } from "@/src/ui/toggle-row";
import { AUDIO_FORMAT_CHOICES, CONTAINER_CHOICES, KIND_CHOICES } from "./choices";

type DownloadOptionsFormProps = {
	options: DefaultDownloadOptions;
	qualityChoices: ReadonlyArray<ChipOption<VideoQuality>>;
	onChange: (changes: Partial<DefaultDownloadOptions>) => void;
};

/** Format, quality and extras; shared by the download sheet and the settings defaults. */
export function DownloadOptionsForm({
	options,
	qualityChoices,
	onChange,
}: DownloadOptionsFormProps) {
	const isVideo = options.kind === "video";
	return (
		<View className="gap-6">
			<SegmentedControl
				options={KIND_CHOICES}
				selected={options.kind}
				onSelect={(kind) => onChange({ kind })}
			/>

			{isVideo ? (
				<>
					<Section title="Quality">
						<OptionChips
							accessibilityLabel="Video quality"
							options={qualityChoices}
							selected={options.videoQuality}
							onSelect={(videoQuality) => onChange({ videoQuality })}
						/>
					</Section>
					<Section title="Container">
						<OptionChips
							accessibilityLabel="Video container"
							options={CONTAINER_CHOICES}
							selected={options.videoContainer}
							onSelect={(videoContainer) => onChange({ videoContainer })}
						/>
					</Section>
				</>
			) : (
				<Section title="Audio format">
					<OptionChips
						accessibilityLabel="Audio format"
						options={AUDIO_FORMAT_CHOICES}
						selected={options.audioFormat}
						onSelect={(audioFormat) => onChange({ audioFormat })}
					/>
				</Section>
			)}

			<Section title="Extras">
				<Card className="gap-5 p-4">
					<ToggleRow
						label="Embed metadata"
						description="Title, artist and date inside the file"
						isSelected={options.embedMetadata}
						onChange={(embedMetadata) => onChange({ embedMetadata })}
					/>
					<ToggleRow
						label="Embed thumbnail"
						description={
							isVideo || options.audioFormat !== "opus"
								? "Use the thumbnail as cover art"
								: "Not supported for Opus"
						}
						isSelected={options.embedThumbnail}
						onChange={(embedThumbnail) => onChange({ embedThumbnail })}
					/>
					{isVideo ? (
						<ToggleRow
							label="Embed subtitles"
							description="English subtitles when available"
							isSelected={options.embedSubtitles}
							onChange={(embedSubtitles) => onChange({ embedSubtitles })}
						/>
					) : null}
				</Card>
			</Section>
		</View>
	);
}
