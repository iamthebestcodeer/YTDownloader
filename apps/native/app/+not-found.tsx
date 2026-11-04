import { Link, Stack } from "expo-router";
import { Button } from "heroui-native";

import { EmptyState } from "@/src/ui/empty-state";
import { Screen } from "@/src/ui/screen";

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: "Not found" }} />
			<Screen>
				<EmptyState
					icon="help-circle-outline"
					title="Page not found"
					message="This link does not lead anywhere in the app."
					action={
						<Link href="/" asChild>
							<Button>Go home</Button>
						</Link>
					}
				/>
			</Screen>
		</>
	);
}
