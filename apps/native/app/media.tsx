import { Redirect, useLocalSearchParams } from "expo-router";

import { MediaScreen } from "@/src/features/media/media-screen";

export default function MediaRoute() {
	const { url } = useLocalSearchParams<{ url?: string }>();
	if (!url) return <Redirect href="/" />;
	return <MediaScreen key={url} url={url} />;
}
