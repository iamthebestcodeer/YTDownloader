const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}]+$/;
const YOUTUBE_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com"];

/** Returns the first http(s) link inside free text, such as a shared message. */
export function extractUrl(text: string): string | null {
	const match = text.match(URL_PATTERN);
	if (!match) return null;
	return match[0].replace(TRAILING_PUNCTUATION, "");
}

export function looksLikeUrl(text: string): boolean {
	return extractUrl(text.trim()) !== null;
}

export function isYoutubeUrl(url: string): boolean {
	const host = hostOf(url);
	if (!host) return false;
	return YOUTUBE_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/** A watch link that also references a playlist, e.g. `watch?v=abc&list=xyz`. */
export function isVideoInsidePlaylist(url: string): boolean {
	const params = searchParamsOf(url);
	return Boolean(params?.get("v") && params.get("list"));
}

function hostOf(url: string): string | null {
	try {
		return new URL(url).hostname.toLowerCase();
	} catch {
		return null;
	}
}

function searchParamsOf(url: string): URLSearchParams | null {
	try {
		return new URL(url).searchParams;
	} catch {
		return null;
	}
}
