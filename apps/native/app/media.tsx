import { Redirect, useLocalSearchParams } from "expo-router";

import { extractUrl } from "@/src/domain/url";
import { MediaScreen } from "@/src/features/media/media-screen";

export default function MediaRoute() {
	const { url: param } = useLocalSearchParams<{ url?: string | string[] }>();
	// Deep links can put anything here, so only accept a real http(s) link.
	const url = extractUrl([param].flat()[0] ?? "");
	if (!url) return <Redirect href="/" />;
	return <MediaScreen key={url} url={url} />;
}
