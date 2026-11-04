import { useCallback, useRef, useState } from "react";

import { summarizeError } from "@/src/domain/progress";

export type AsyncState<Data> =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; data: Data }
	| { status: "error"; message: string };

/**
 * Tracks one async operation at a time. Starting a new run discards the result of
 * any run still in flight, so stale responses never overwrite fresh ones.
 */
export function useAsyncTask<Args extends unknown[], Data>(task: (...args: Args) => Promise<Data>) {
	const [state, setState] = useState<AsyncState<Data>>({ status: "idle" });
	const latestRun = useRef(0);

	const run = useCallback(
		async (...args: Args) => {
			const runId = ++latestRun.current;
			setState({ status: "loading" });
			try {
				const data = await task(...args);
				if (runId === latestRun.current) setState({ status: "success", data });
			} catch (error) {
				const message = summarizeError(error instanceof Error ? error.message : String(error));
				if (runId === latestRun.current) setState({ status: "error", message });
			}
		},
		[task],
	);

	const reset = useCallback(() => {
		latestRun.current++;
		setState({ status: "idle" });
	}, []);

	return { state, run, reset };
}
