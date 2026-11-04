import { cn } from "heroui-native";
import { View } from "react-native";

type ProgressBarProps = {
	/** From 0 to 1. */
	value: number;
	tone?: "accent" | "success" | "muted";
};

const TONE_CLASS = {
	accent: "bg-accent",
	success: "bg-success",
	muted: "bg-muted",
} as const;

export function ProgressBar({ value, tone = "accent" }: ProgressBarProps) {
	const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
	return (
		<View
			className="bg-default h-1.5 overflow-hidden rounded-full"
			accessibilityRole="progressbar"
			accessibilityValue={{ min: 0, max: 100, now: percent }}
		>
			<View
				className={cn("h-full rounded-full", TONE_CLASS[tone])}
				style={{ width: `${percent}%` }}
			/>
		</View>
	);
}
