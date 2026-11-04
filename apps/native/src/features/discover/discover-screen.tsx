import * as Clipboard from "expo-clipboard";
import { Button, Spinner, useToast } from "heroui-native";
import { useCallback, useState } from "react";
import { View } from "react-native";

import type { VideoSummary } from "@/src/domain/types";
import { extractUrl } from "@/src/domain/url";
import { engine } from "@/src/engine";
import { useAsyncTask } from "@/src/hooks/use-async-task";
import { EmptyState } from "@/src/ui/empty-state";
import { Screen } from "@/src/ui/screen";
import { Section } from "@/src/ui/section";

import { openMedia } from "../navigation";
import { SearchBar } from "./search-bar";
import { VideoRow } from "./video-row";

const search = (query: string) => engine.search(query);

export function DiscoverScreen() {
	const [query, setQuery] = useState("");
	const { state, run, reset } = useAsyncTask(search);
	const { toast } = useToast();

	const submit = useCallback(() => {
		const text = query.trim();
		if (!text) return;
		const url = extractUrl(text);
		if (url) openMedia(url);
		else void run(text);
	}, [query, run]);

	const pasteLink = useCallback(async () => {
		const url = extractUrl(await Clipboard.getStringAsync());
		if (!url) {
			toast.show({ variant: "warning", label: "No link on the clipboard" });
			return;
		}
		setQuery(url);
		openMedia(url);
	}, [toast]);

	const changeQuery = useCallback(
		(text: string) => {
			setQuery(text);
			if (!text) reset();
		},
		[reset],
	);

	const openVideo = useCallback((video: VideoSummary) => openMedia(video.url), []);

	return (
		<Screen>
			<SearchBar value={query} onChange={changeQuery} onSubmit={submit} onPaste={pasteLink} />
			{state.status === "idle" ? (
				<EmptyState
					icon="cloud-download-outline"
					title="Find something to save"
					message="Search YouTube, paste a video or playlist link, or share a link to this app from YouTube."
				/>
			) : null}
			{state.status === "loading" ? (
				<View className="items-center py-12">
					<Spinner size="lg" />
				</View>
			) : null}
			{state.status === "error" ? (
				<EmptyState
					icon="alert-circle-outline"
					title="Search failed"
					message={state.message}
					action={<Button onPress={submit}>Try again</Button>}
				/>
			) : null}
			{state.status === "success" ? (
				<SearchResults results={state.data} onOpen={openVideo} />
			) : null}
		</Screen>
	);
}

type SearchResultsProps = {
	results: VideoSummary[];
	onOpen: (video: VideoSummary) => void;
};

function SearchResults({ results, onOpen }: SearchResultsProps) {
	if (results.length === 0) {
		return <EmptyState icon="search-outline" title="No results" message="Try different words." />;
	}
	return (
		<Section title={`${results.length} results`}>
			<View className="gap-4">
				{results.map((video) => (
					<VideoRow key={video.id} video={video} onPress={onOpen} />
				))}
			</View>
		</Section>
	);
}
