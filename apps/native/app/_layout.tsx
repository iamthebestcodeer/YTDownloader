import "@/global.css";

import { Stack } from "expo-router";
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { useAppBootstrap } from "@/src/app-bootstrap";

export const unstable_settings = {
	anchor: "(tabs)",
};

function RootStack() {
	useAppBootstrap();
	const foreground = useThemeColor("foreground");
	const background = useThemeColor("background");

	return (
		<Stack
			screenOptions={{
				headerTintColor: foreground,
				headerStyle: { backgroundColor: background },
				headerShadowVisible: false,
				contentStyle: { backgroundColor: background },
			}}
		>
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			<Stack.Screen name="media" options={{ title: "Download" }} />
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<KeyboardProvider>
				<HeroUINativeProvider>
					<RootStack />
				</HeroUINativeProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
