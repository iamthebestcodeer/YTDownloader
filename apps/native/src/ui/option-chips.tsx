import { Chip } from "heroui-native";
import { View } from "react-native";

export type ChipOption<Value> = {
	value: Value;
	label: string;
	hint?: string;
};

type OptionChipsProps<Value> = {
	options: ReadonlyArray<ChipOption<Value>>;
	selected: Value;
	onSelect: (value: Value) => void;
	accessibilityLabel: string;
};

/** A single-choice picker rendered as a wrapping row of chips. */
export function OptionChips<Value extends string | number>({
	options,
	selected,
	onSelect,
	accessibilityLabel,
}: OptionChipsProps<Value>) {
	return (
		<View
			className="flex-row flex-wrap gap-2"
			accessibilityRole="radiogroup"
			accessibilityLabel={accessibilityLabel}
		>
			{options.map((option) => {
				const isSelected = option.value === selected;
				return (
					<Chip
						key={String(option.value)}
						size="lg"
						variant={isSelected ? "primary" : "secondary"}
						color={isSelected ? "accent" : "default"}
						onPress={() => onSelect(option.value)}
						accessibilityRole="radio"
						accessibilityState={{ selected: isSelected }}
					>
						<Chip.Label>
							{option.hint ? `${option.label} · ${option.hint}` : option.label}
						</Chip.Label>
					</Chip>
				);
			})}
		</View>
	);
}
