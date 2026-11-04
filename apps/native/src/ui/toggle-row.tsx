import { ControlField, Description, Label, Switch } from "heroui-native";
import { View } from "react-native";

type ToggleRowProps = {
	label: string;
	description?: string;
	isSelected: boolean;
	onChange: (isSelected: boolean) => void;
};

export function ToggleRow({ label, description, isSelected, onChange }: ToggleRowProps) {
	return (
		<ControlField isSelected={isSelected} onSelectedChange={onChange}>
			<View className="flex-1 pr-4">
				<Label>{label}</Label>
				{description ? <Description>{description}</Description> : null}
			</View>
			<ControlField.Indicator>
				<Switch />
			</ControlField.Indicator>
		</ControlField>
	);
}
