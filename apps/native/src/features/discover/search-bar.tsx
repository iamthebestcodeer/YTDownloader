import { Button, SearchField } from "heroui-native";
import { View } from "react-native";

import { Icon } from "@/src/ui/icon";

type SearchBarProps = {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	onPaste: () => void;
};

export function SearchBar({ value, onChange, onSubmit, onPaste }: SearchBarProps) {
	return (
		<View className="flex-row items-center gap-2">
			<SearchField value={value} onChange={onChange} className="flex-1">
				<SearchField.Group>
					<SearchField.SearchIcon />
					<SearchField.Input
						placeholder="Search or paste a link"
						returnKeyType="search"
						autoCapitalize="none"
						autoCorrect={false}
						onSubmitEditing={onSubmit}
					/>
					<SearchField.ClearButton />
				</SearchField.Group>
			</SearchField>
			<Button
				isIconOnly
				variant="secondary"
				onPress={onPaste}
				accessibilityLabel="Paste link from clipboard"
			>
				<Icon name="clipboard-outline" />
			</Button>
		</View>
	);
}
