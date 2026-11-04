import { Button, Card, Spinner, useToast } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DownloadOptions, MediaInfo } from "@/src/domain/types";
import { isVideoInsidePlaylist } from "@/src/domain/url";
import { engine } from "@/src/engine";
import { useAsyncTask } from "@/src/hooks/use-async-task";
import { useDownloadsStore } from "@/src/store/downloads-store";
import { useSettingsStore } from "@/src/store/settings-store";
import { EmptyState } from "@/src/ui/empty-state";
import { Screen } from "@/src/ui/screen";
import { ToggleRow } from "@/src/ui/toggle-row";

import {
	closestAvailableQuality,
	qualityChoices,
	STANDARD_QUALITY_CHOICES,
} from "../download-options/choices";
import { DownloadOptionsForm } from "../download-options/download-options-form";
import { showDownloads } from "../navigation";
import { planDownload } from "./download-plan";
import { MediaHeader } from "./media-header";
import { PlaylistEntries } from "./playlist-entries";

const fetchInfo = (url: string) => engine.fetchInfo(url);

export function MediaScreen({ url }: { url: string }) {
	const { state, run } = useAsyncTask(fetchInfo);

	useEffect(() => {
		void run(url);
	}, [run, url]);

	switch (state.status) {
		case "idle":
		case "loading":
			return <LoadingMedia />;
		case "error":
			return (
				<Screen>
					<EmptyState
						icon="alert-circle-outline"
						title="Could not load this link"
						message={state.message}
						action={<Button onPress={() => run(url)}>Try again</Button>}
					/>
				</Screen>
			);
		case "success":
			return <MediaDetails info={state.data} requestedUrl={url} />;
	}
}

function LoadingMedia() {
	return (
		<Screen>
			<View className="bg-default aspect-video w-full rounded-xl" />
			<View className="bg-default h-6 w-4/5 rounded-md" />
			<View className="bg-default h-4 w-1/3 rounded-md" />
			<View className="items-center gap-2 pt-6">
				<Spinner />
			</View>
		</Screen>
	);
}

function MediaDetails({ info, requestedUrl }: { info: MediaInfo; requestedUrl: string }) {
	const [options, setOptions] = useInitialOptions(info);
	const enqueue = useDownloadsStore((store) => store.enqueue);
	const { toast } = useToast();
	const insets = useSafeAreaInsets();

	const plan = planDownload(info, requestedUrl, options);
	const choices = info.kind === "video" ? qualityChoices(info.qualities) : STANDARD_QUALITY_CHOICES;
	const canChoosePlaylist = info.kind === "playlist" && isVideoInsidePlaylist(requestedUrl);

	const startDownload = useCallback(() => {
		enqueue({
			url: plan.url,
			title: plan.title,
			thumbnailUrl: plan.thumbnailUrl,
			options: { ...options, includePlaylist: plan.includePlaylist },
		});
		toast.show({
			variant: "success",
			label: "Added to downloads",
			description: plan.title,
		});
		showDownloads();
	}, [enqueue, options, plan, toast]);

	const footer = (
		<View
			className="border-separator bg-background border-t px-4 pt-3"
			style={{ paddingBottom: insets.bottom + 12 }}
		>
			<Button size="lg" onPress={startDownload}>
				{plan.buttonLabel}
			</Button>
		</View>
	);

	return (
		<Screen footer={footer}>
			<MediaHeader info={info} />
			{canChoosePlaylist ? (
				<Card className="p-4">
					<ToggleRow
						label="Download the whole playlist"
						description="Turn off to save only the video you opened"
						isSelected={options.includePlaylist}
						onChange={(includePlaylist) =>
							setOptions((current) => ({ ...current, includePlaylist }))
						}
					/>
				</Card>
			) : null}
			{info.kind === "playlist" && plan.includePlaylist ? (
				<PlaylistEntries entries={info.entries} />
			) : null}
			<DownloadOptionsForm
				options={options}
				qualityChoices={choices}
				onChange={(changes) => setOptions((current) => ({ ...current, ...changes }))}
			/>
		</Screen>
	);
}

/** Starts from the user's saved defaults, adjusted to what this link actually offers. */
function useInitialOptions(info: MediaInfo) {
	const defaults = useSettingsStore((store) => store.defaults);
	return useState<DownloadOptions>(() => ({
		...defaults,
		videoQuality:
			info.kind === "video"
				? closestAvailableQuality(
						defaults.videoQuality,
						info.qualities.map((option) => option.quality),
					)
				: defaults.videoQuality,
		includePlaylist: info.kind === "playlist",
	}));
}
