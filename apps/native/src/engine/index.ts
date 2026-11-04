import { Platform } from "react-native";

import { YtDlp } from "@/modules/yt-dlp";

import type { DownloadEngine } from "./download-engine";
import { createNativeEngine } from "./native-engine";
import { createPreviewEngine } from "./preview-engine";
import { unsupportedEngine } from "./unsupported-engine";

function selectEngine(): DownloadEngine {
	if (YtDlp) return createNativeEngine(YtDlp);
	if (Platform.OS === "web" && __DEV__) return createPreviewEngine();
	return unsupportedEngine;
}

export const engine = selectEngine();
export type { DownloadEngine, EngineProgress } from "./download-engine";
