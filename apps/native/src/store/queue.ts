import { engine } from "@/src/engine";

import { DownloadQueue } from "./download-queue";

/** The app-wide queue that runs downloads on the platform's engine. */
export const downloadQueue = new DownloadQueue(engine);
