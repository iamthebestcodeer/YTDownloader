import { Tabs } from "heroui-native";

import type { ChipOption } from "./option-chips";

type SegmentedControlProps<Value extends string> = {
	options: ReadonlyArray<ChipOption<Value>>;
	selected: Value;
	onSelect: (value: Value) => void;
};

/** A compact switch between a few mutually exclusive modes. */
export function SegmentedControl<Value extends string>({
	options,
	selected,
	onSelect,
}: SegmentedControlProps<Value>) {
	return (
		<Tabs value={selected} onValueChange={(value) => onSelect(value as Value)} variant="primary">
			<Tabs.List className="w-full">
				<Tabs.Indicator />
				{options.map((option) => (
					<Tabs.Trigger key={option.value} value={option.value} className="flex-1">
						<Tabs.Label>{option.label}</Tabs.Label>
					</Tabs.Trigger>
				))}
			</Tabs.List>
		</Tabs>
	);
}
