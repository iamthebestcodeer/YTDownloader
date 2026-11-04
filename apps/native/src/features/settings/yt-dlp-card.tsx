import { Button, Card, useToast } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { summarizeError } from "@/src/domain/progress";
import { engine } from "@/src/engine";

/** Shows the bundled yt-dlp version and lets the user pull the latest release. */
export function YtDlpCard() {
	const [version, setVersion] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const { toast } = useToast();

	const refreshVersion = useCallback(async () => {
		setVersion(await engine.version().catch(() => null));
	}, []);

	useEffect(() => {
		void refreshVersion();
	}, [refreshVersion]);

	const update = useCallback(async () => {
		setIsUpdating(true);
		try {
			const result = await engine.update();
			toast.show({
				variant: "success",
				label: result === "updated" ? "yt-dlp updated" : "yt-dlp is already up to date",
			});
			await refreshVersion();
		} catch (error) {
			const message = summarizeError(error instanceof Error ? error.message : String(error));
			toast.show({
				variant: "danger",
				label: "Update failed",
				description: message,
			});
		} finally {
			setIsUpdating(false);
		}
	}, [refreshVersion, toast]);

	return (
		<Card className="gap-3 p-4">
			<View className="gap-1">
				<Card.Title>yt-dlp {version ?? "—"}</Card.Title>
				<Card.Description>
					Sites change often. If downloads start failing, updating yt-dlp usually fixes it.
				</Card.Description>
			</View>
			<Button variant="secondary" onPress={update} isDisabled={isUpdating || !engine.isSupported}>
				{isUpdating ? "Updating…" : "Check for updates"}
			</Button>
			<Text className="text-muted text-xs">Files are saved to Download/YTDownloader.</Text>
		</Card>
	);
}
