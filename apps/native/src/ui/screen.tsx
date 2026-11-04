import { cn } from "heroui-native";
import type { PropsWithChildren, ReactElement } from "react";
import { ScrollView, type ScrollViewProps, View } from "react-native";

type ScreenProps = PropsWithChildren<{
	className?: string;
	refreshControl?: ScrollViewProps["refreshControl"];
	footer?: ReactElement;
}>;

/** Scrollable page body with consistent padding; an optional footer stays pinned at the bottom. */
export function Screen({ children, className, refreshControl, footer }: ScreenProps) {
	return (
		<View className="bg-background flex-1">
			<ScrollView
				contentContainerClassName={cn("gap-6 px-4 pt-4 pb-10", className)}
				keyboardShouldPersistTaps="handled"
				refreshControl={refreshControl}
			>
				{children}
			</ScrollView>
			{footer}
		</View>
	);
}
