import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

export type IconName = ComponentProps<typeof Ionicons>["name"];

type IconProps = {
	name: IconName;
	size?: number;
	className?: string;
};

export function Icon({ name, size = 20, className = "text-foreground" }: IconProps) {
	return <StyledIonicons name={name} size={size} className={className} />;
}
