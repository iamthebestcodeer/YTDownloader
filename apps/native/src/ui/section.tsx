import type { PropsWithChildren, ReactNode } from "react";
import { Text, View } from "react-native";

type SectionProps = PropsWithChildren<{
	title: string;
	action?: ReactNode;
}>;

export function Section({ title, action, children }: SectionProps) {
	return (
		<View className="gap-3">
			<View className="min-h-8 flex-row items-center justify-between">
				<Text className="text-muted text-xs font-semibold tracking-wider uppercase">{title}</Text>
				{action}
			</View>
			{children}
		</View>
	);
}
