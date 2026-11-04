import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { Icon, type IconName } from "./icon";

type EmptyStateProps = {
	icon: IconName;
	title: string;
	message: string;
	action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
	return (
		<View className="items-center gap-3 px-6 py-12">
			<View className="bg-accent-soft size-16 items-center justify-center rounded-full">
				<Icon name={icon} size={28} className="text-accent" />
			</View>
			<Text className="text-foreground text-center text-lg font-semibold">{title}</Text>
			<Text className="text-muted text-center text-sm">{message}</Text>
			{action}
		</View>
	);
}
