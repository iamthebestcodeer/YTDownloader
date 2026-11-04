import { router } from "expo-router";

export function openMedia(url: string): void {
	router.push({ pathname: "/media", params: { url } });
}

export function showDownloads(): void {
	router.navigate("/downloads");
}
