import {
	isBlockedByYoutube,
	type PlayerClient,
	playerClientArgs,
	rotationOrder,
} from "@/src/domain/player-clients";

type Attempt<Result> = (clientArgs: string[]) => Promise<Result>;

/**
 * Retries a yt-dlp call with the next YouTube player client whenever YouTube refuses the
 * current one, and remembers the client that last worked so later calls start with it.
 */
export class ClientRotation {
	private preferred: PlayerClient | null = null;

	/**
	 * @param isComplete Results that work but are poor (e.g. metadata without formats) are
	 *   kept as a fallback while the remaining clients get a chance to do better.
	 */
	async run<Result>(
		attempt: Attempt<Result>,
		isComplete: (result: Result) => boolean = () => true,
	): Promise<Result> {
		let fallback: { result: Result; client: PlayerClient } | null = null;
		let lastError: unknown = null;

		for (const client of rotationOrder(this.preferred)) {
			try {
				const result = await attempt(playerClientArgs(client));
				if (isComplete(result)) {
					this.preferred = client;
					return result;
				}
				fallback ??= { result, client };
			} catch (error) {
				if (!isBlockedByYoutube(messageOf(error))) throw error;
				lastError = error;
			}
		}

		if (fallback) return fallback.result;
		throw lastError;
	}
}

function messageOf(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
