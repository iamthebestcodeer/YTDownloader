import { useEffect } from "react";

import { YtDlp } from "@/modules/yt-dlp";
import { extractUrl } from "@/src/domain/url";

import { openMedia } from "../navigation";

function openSharedText(text: string | null): void {
	const url = text ? extractUrl(text) : null;
	if (url) openMedia(url);
}

/** Opens links shared to the app from other apps ("Share → YTDownloader"). */
export function useSharedLinks(): void {
	useEffect(() => {
		if (!YtDlp) return;
		openSharedText(YtDlp.consumeSharedText());
		const subscription = YtDlp.addListener("onSharedText", ({ text }) => openSharedText(text));
		return () => subscription.remove();
	}, []);
}
