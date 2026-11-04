import { extractUrl, isYoutubeUrl } from "@/src/domain/url";

/**
 * Android opens YouTube links in this app (see the intent filters in app.config.ts).
 * Expo Router would treat them as unknown routes, so send them to the media screen.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
	const url = extractUrl(path);
	if (url && isYoutubeUrl(url)) return `/media?url=${encodeURIComponent(url)}`;
	return path;
}
