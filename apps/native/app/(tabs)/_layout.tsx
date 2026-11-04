import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";

import { isActive } from "@/src/domain/job";
import { useSharedLinks } from "@/src/features/share/use-shared-links";
import { useDownloadsStore } from "@/src/store/downloads-store";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IoniconName) {
	return ({ color, size }: { color: ColorValue; size: number }) => (
		<Ionicons name={name} size={size} color={color} />
	);
}

export default function TabLayout() {
	useSharedLinks();
	const activeCount = useDownloadsStore((store) => store.jobs.filter(isActive).length);
	const [foreground, background, accent, muted, separator] = useThemeColor([
		"foreground",
		"background",
		"accent",
		"muted",
		"separator",
	]);

	return (
		<Tabs
			screenOptions={{
				headerStyle: { backgroundColor: background },
				headerTintColor: foreground,
				headerShadowVisible: false,
				headerTitleStyle: { fontWeight: "700", fontSize: 22 },
				tabBarActiveTintColor: accent,
				tabBarInactiveTintColor: muted,
				tabBarStyle: { backgroundColor: background, borderTopColor: separator },
				sceneStyle: { backgroundColor: background },
			}}
		>
			<Tabs.Screen name="index" options={{ title: "Discover", tabBarIcon: tabIcon("search") }} />
			<Tabs.Screen
				name="downloads"
				options={{
					title: "Downloads",
					tabBarIcon: tabIcon("download"),
					tabBarBadge: activeCount > 0 ? activeCount : undefined,
					tabBarBadgeStyle: { backgroundColor: accent },
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{ title: "Settings", tabBarIcon: tabIcon("settings-outline") }}
			/>
		</Tabs>
	);
}
